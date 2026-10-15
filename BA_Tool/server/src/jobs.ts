// Quản lý tác vụ AI chạy nền + phát tiến độ qua SSE.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { AgentError, runSkill, type AgentEvent } from './agent.js';
import {
  HttpError,
  appendFollowup,
  diffSrs,
  fixDir,
  loadProject,
  normalizeQuestions,
  projectDir,
  readQuestionsFile,
  snapshotSrs,
  srsDir,
  updateProject,
  writeAnswersFile,
  writeRequestFile,
} from './projects.js';
import { FollowupSetSchema, QuestionSetSchema, StandardQuestionSetSchema, projectTypeOf, usesRegistry, type JobKind, type Phase, type Project } from './schemas.js';
import { checkRegistry, writeGenerated } from './registry.js';
import { checkDesignTokens } from './design.js';
import { REVIEW_AI, buildReview, codeReview, readAiReview, readReview, reviewSummary, writeReview } from './review.js';
import { diffDirs, listAll } from './versions.js';
import { listPages, listSections, scanHardcoded, writeAtmos, writeFoundation, writeMotion, writeUi } from './prototype-assets.js';
import { writeRuntime } from './prototype-runtime.js';
import { QA_JSON, qaSummary, runQa, type QaReport } from './qa.js';
import { detectPreset, presetById } from './presets.js';

/** Tên preset sẽ dùng (BA chọn, hoặc tool nhận diện từ mô tả) — hiện trong tiến độ. */
function conceptLabel(p: Project): string {
  const chosen = p.concept?.preset && p.concept.preset !== 'auto' ? presetById(p.concept.preset) : undefined;
  const preset = chosen ?? detectPreset(`${p.request} ${p.concept?.mood ?? ''}`);
  const motion = p.concept?.motion && p.concept.motion !== 'auto' ? p.concept.motion : preset?.motion;
  return `${preset ? preset.name : 'AI tự chọn preset'}${chosen || !preset ? '' : ' (tự nhận diện)'}${motion ? ` · chuyển động Level ${motion}` : ''}`;
}

export type JobEvent =
  | AgentEvent
  | { type: 'status'; status: 'running' | 'done' | 'error'; error?: string; errorCode?: string }
  | { type: 'step'; text: string };

interface Job {
  id: string;
  slug: string;
  kind: JobKind;
  status: 'running' | 'done' | 'error';
  events: JobEvent[];
  clients: Set<Response>;
  abort: AbortController;
}

const jobs = new Map<string, Job>();

export function getJob(id: string) {
  return jobs.get(id);
}

function emit(job: Job, e: JobEvent) {
  job.events.push(e);
  const line = `data: ${JSON.stringify(e)}\n\n`;
  for (const res of job.clients) res.write(line);
}

/** Gắn một trình duyệt vào luồng sự kiện (phát lại các sự kiện đã có). */
export function attachClient(job: Job, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  for (const e of job.events) res.write(`data: ${JSON.stringify(e)}\n\n`);
  if (job.status !== 'running') {
    res.end();
    return;
  }
  job.clients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  res.on('close', () => {
    clearInterval(ping);
    job.clients.delete(res);
  });
}

/** Khi server khởi động lại, tác vụ đang chạy trong project.json không còn — đánh dấu lỗi. */
export function reconcileJob(p: Project): Project {
  if (p.job && p.job.status === 'running' && !jobs.has(p.job.id)) {
    p.job = { ...p.job, status: 'error', errorCode: 'other', error: 'Tác vụ bị gián đoạn (server đã khởi động lại). Bấm "Chạy lại bước này".' };
  }
  return p;
}

/** Tham số tác vụ — lưu lại để "Chạy lại bước này" chạy đúng như cũ. */
export interface JobParams {
  targetDir?: string;
  findingId?: string;
  /** quick-revise: góp ý của BA; để trống = sửa theo báo cáo QA */
  feedback?: string;
  /** quick-revise: chỉ sửa trong section có id này (để trống = toàn trang) */
  section?: string;
}

export async function startJob(slug: string, kind: JobKind, params: JobParams = {}): Promise<string> {
  const p = await loadProject(slug);
  if (p.job?.status === 'running' && jobs.has(p.job.id)) throw new HttpError(409, 'Dự án đang có tác vụ AI chạy.');

  const job: Job = { id: randomUUID(), slug, kind, status: 'running', events: [], clients: new Set(), abort: new AbortController() };
  jobs.set(job.id, job);
  await updateProject(slug, (pr) => {
    pr.job = { id: job.id, kind, status: 'running', targetDir: params.targetDir, findingId: params.findingId, feedback: params.feedback, section: params.section };
  });

  // Chạy nền, không chờ
  void runJob(job, params).then(
    async () => {
      job.status = 'done';
      await updateProject(slug, (pr) => {
        pr.job = { id: job.id, kind, status: 'done', targetDir: params.targetDir, findingId: params.findingId, feedback: params.feedback, section: params.section };
      });
      emit(job, { type: 'status', status: 'done' });
      closeClients(job);
    },
    async (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const errorCode = err instanceof AgentError ? err.code : 'other';
      const resetsAt = err instanceof AgentError ? err.resetsAt : undefined;
      job.status = 'error';
      // Chỉ ghi trạng thái tác vụ — câu trả lời, màn hình hiện tại và các file đã có được giữ nguyên
      await updateProject(slug, (pr) => {
        pr.job = { id: job.id, kind, status: 'error', error: message, errorCode, resetsAt, targetDir: params.targetDir, findingId: params.findingId, feedback: params.feedback, section: params.section };
      }).catch(() => {});
      emit(job, { type: 'status', status: 'error', error: message, errorCode });
      closeClients(job);
    },
  );
  return job.id;
}

/** "Chạy lại bước này": chạy lại đúng tác vụ bị lỗi gần nhất với cùng tham số. */
export async function retryLastJob(slug: string): Promise<string> {
  const p = reconcileJob(await loadProject(slug));
  if (!p.job || p.job.status !== 'error') throw new HttpError(400, 'Không có bước nào cần chạy lại.');
  // Vòng bổ sung đã xong (không có câu nào) nhưng lỗi lúc viết SRS → chỉ chạy lại phần viết SRS
  if (p.job.kind === 'business-followup' && p.business.followupStatus) return startJob(slug, 'business-srs');
  if (p.job.kind === 'ui-followup' && p.ui.followupStatus) return startJob(slug, 'ui-srs');
  return startJob(slug, p.job.kind, { targetDir: p.job.targetDir, findingId: p.job.findingId, feedback: p.job.feedback, section: p.job.section });
}

function closeClients(job: Job) {
  for (const res of job.clients) res.end();
  job.clients.clear();
  // Giữ lịch sử sự kiện 30 phút để trình duyệt kết nối lại
  setTimeout(() => jobs.delete(job.id), 30 * 60 * 1000).unref();
}

async function runJob(job: Job, params: JobParams) {
  const dir = projectDir(job.slug);
  const loaded = await loadProject(job.slug);
  const projectType = projectTypeOf(loaded);
  const srsMode = usesRegistry(loaded) ? 'registry' : 'legacy';
  const relFile = (f: string) => {
    const base = params.targetDir && path.resolve(f).toLowerCase().startsWith(path.resolve(params.targetDir).toLowerCase())
      ? params.targetDir
      : dir;
    return path.relative(base, f).split(path.sep).join('/');
  };
  const onEvent = (e: AgentEvent) => emit(job, e.type === 'file' ? { ...e, path: relFile(e.path) } : e);
  const runAs = (mode: JobKind, extra?: string, projectDirOverride?: string) =>
    runSkill({ mode, projectType, srsMode, projectDir: projectDirOverride ?? dir, targetDir: params.targetDir, extra, onEvent, signal: job.abort.signal });
  const run = (extra?: string) => runAs(job.kind, extra);

  /** Viết SRS nghiệp vụ / bổ sung SRS giao diện (dùng cho tác vụ *-srs và khi vòng bổ sung không có câu nào). */
  const runSrs = async (phase: Phase) => {
    const p = await loadProject(job.slug);
    await writeAnswersFile(p, phase);
    await fs.mkdir(srsDir(job.slug), { recursive: true });
    const before = await snapshotSrs(job.slug);
    emit(job, { type: 'step', text: phase === 'business' ? 'Đang viết SRS nghiệp vụ…' : 'Đang bổ sung SRS giao diện…' });
    const mode = phase === 'business' ? 'business-srs' : 'ui-srs';
    await runAs(mode);
    const registryErrors = srsMode === 'registry' ? await finishRegistry(phase, mode) : undefined;
    const changes = await diffSrs(job.slug, before);
    if (srsMode === 'registry') await runReview({ failSoft: true });
    if (!changes.some((c) => c.path === 'README.md') && !before.has('README.md')) {
      throw new Error('AI chưa tạo được mục lục srs/README.md. Hãy thử chạy lại.');
    }
    // Kiểm tra theo trạng thái file sau khi chạy (không chỉ file thay đổi lần này):
    // khi "Chạy lại" sau lỗi giữa chừng, file có thể đã được tạo từ lần trước.
    const inventory = path.join(srsDir(job.slug), '09-ui-ux', '03-screen-inventory.md');
    if (phase === 'ui' && !(await fs.access(inventory).then(() => true, () => false))) {
      throw new Error('AI chưa tạo 09-ui-ux/03-screen-inventory.md. Hãy thử chạy lại.');
    }
    await updateProject(job.slug, (pr) => {
      pr.srsChanges = changes;
      pr.screen = phase === 'business' ? 'business-review' : 'ui-review';
      if (registryErrors) pr.registryErrors = registryErrors;
    });
    emit(job, { type: 'step', text: `Hoàn tất: ${changes.length} file SRS được tạo / cập nhật.` });
  };

  /**
   * Kiểm tra registry + phân quyền (+ design tokens ở bước giao diện); sai thì cho AI sửa đúng các lỗi đó một lần.
   * Sau đó sinh Phần 12 và bảng 4.2 bằng code. Trả về lỗi còn lại (không chặn kết quả SRS).
   */
  const finishRegistry = async (phase: Phase, mode: JobKind): Promise<string[]> => {
    const srs = srsDir(job.slug);
    emit(job, {
      type: 'step',
      text: phase === 'ui'
        ? 'Đang kiểm tra registry, phân quyền và design tokens…'
        : 'Đang kiểm tra sổ đăng ký mã (_registry.json) và ma trận phân quyền…',
    });
    const checkAll = async () => {
      const check = await checkRegistry(srs, phase);
      const errors = [...check.errors, ...(phase === 'ui' ? await checkDesignTokens(srs) : [])];
      return { check, errors };
    };
    let { check, errors } = await checkAll();
    if (errors.length) {
      emit(job, { type: 'step', text: `Có ${errors.length} lỗi định dạng / tham chiếu, đang yêu cầu AI sửa…` });
      await runAs(
        mode,
        `SỬA REGISTRY: SRS đã viết xong. Chỉ sửa các lỗi dưới đây trong srs/_registry.json, srs/_permissions.json, srs/_design-tokens.json ` +
          `(và file SRS liên quan nếu lỗi do thiếu file / thiếu mã). Không viết lại SRS. ` +
          `Định dạng: references/registry-guide.md, references/design-guide.md mục 1.\n` +
          errors.map((e) => `- ${e}`).join('\n'),
      );
      ({ check, errors } = await checkAll());
    }
    const written = await writeGenerated(srs, check, { uiDone: phase === 'ui' });
    if (written.length) emit(job, { type: 'step', text: `Đã sinh tự động: ${written.join(', ')}.` });
    if (errors.length) emit(job, { type: 'step', text: `Còn ${errors.length} lỗi — xem cảnh báo ở màn hình SRS.` });
    return errors;
  };

  /**
   * Rà soát SRS: kiểm bằng code, ghi tạm kết quả (để AI không báo trùng), rồi lượt AI chỉ đọc → gộp.
   * failSoft: lượt AI lỗi (ví dụ hết quota) thì vẫn giữ kết quả kiểm bằng code, không làm hỏng tác vụ.
   */
  const runReview = async ({ failSoft }: { failSoft: boolean }) => {
    const srs = srsDir(job.slug);
    const phase = existsSync(path.join(srs, '09-ui-ux', '03-screen-inventory.md')) ? 'ui' : 'business';
    emit(job, { type: 'step', text: 'Rà soát SRS: đang kiểm tra bằng code (mã, truy vết, phân quyền, trạng thái, Mermaid)…' });
    const code = await codeReview(srs, phase);
    await writeReview(srs, buildReview(code, [], { status: 'skipped' }));
    emit(job, { type: 'step', text: `Kiểm bằng code: ${code.length} vấn đề. AI đang rà mâu thuẫn, thiếu nhánh, yêu cầu mơ hồ…` });
    await fs.rm(path.join(srs, REVIEW_AI), { force: true });
    let ai: Awaited<ReturnType<typeof readAiReview>>;
    try {
      await runAs('srs-review');
      ai = await readAiReview(srs);
    } catch (e) {
      if (!failSoft) throw e;
      ai = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    const review = buildReview(code, ai.ok ? ai.findings : [], ai.ok ? { status: 'done' } : { status: 'failed', error: ai.error });
    await writeReview(srs, review);
    await updateProject(job.slug, (pr) => void (pr.review = reviewSummary(review)));
    const sum = reviewSummary(review);
    emit(job, { type: 'step', text: `Rà soát xong: ${sum.critical} nghiêm trọng, ${sum.major} cần sửa, ${sum.minor} gợi ý${ai.ok ? '' : ' (lượt AI chưa chạy được)'}.` });
  };

  /** QA prototype bằng Playwright (không dùng AI) + HANDOFF.md. failSoft: lỗi QA không làm hỏng tác vụ dựng. */
  const runQaStep = async ({ failSoft }: { failSoft: boolean }) => {
    const target = params.targetDir!;
    emit(job, {
      type: 'step',
      text: loaded.flow === 'quick'
        ? 'QA tự động: mở từng trang ở 375 / 768 / 1440 / 1920px, kiểm lỗi, tràn ngang, bố cục dồn giữa…'
        : 'QA tự động: mở từng trang ở 375 / 768 / 1440px, kiểm lỗi, đăng nhập từng vai trò…',
    });
    try {
      const quick = loaded.flow === 'quick';
      const report = await runQa({
        target,
        srs: quick ? undefined : srsDir(job.slug),
        appName: loaded.name,
        quick,
        onProgress: (text) => emit(job, { type: 'step', text }),
      });
      const sum = qaSummary(report);
      await updateProject(job.slug, (pr) => void (pr.qa = sum));
      emit(job, { type: 'step', text: `QA xong: ${sum.critical} nghiêm trọng, ${sum.major} cần sửa, ${sum.minor} gợi ý · ${sum.screenshots} ảnh chụp${quick ? '' : ' · đã cập nhật HANDOFF.md'}.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!failSoft) throw e;
      await updateProject(job.slug, (pr) => void (pr.qa = { createdAt: new Date().toISOString(), critical: 0, major: 0, minor: 0, screenshots: 0, error: message }));
      emit(job, { type: 'step', text: `QA chưa chạy được: ${message}` });
    }
  };

  /** Prototype vừa dựng / sửa: ghi danh sách trang rồi QA (không chặn kết quả nếu QA lỗi). */
  const afterBuild = async (target: string) => {
    const pages = await listPages(target);
    if (!pages.includes('index.html')) throw new Error('AI chưa tạo index.html trong folder prototype. Hãy thử chạy lại.');
    const sections = loaded.flow === 'quick' ? await listSections(target) : undefined;
    await updateProject(job.slug, (pr) => {
      pr.prototype = { dir: target, builtAt: new Date().toISOString(), pages, ...(sections ? { sections } : {}) };
      pr.screen = 'done';
    });
    emit(job, { type: 'step', text: `Đã dựng ${pages.length} trang.` });
    await runQaStep({ failSoft: true });
  };

  switch (job.kind) {
    // ---------- Chế độ nhanh: landing page, không có SRS ----------
    case 'quick-prototype': {
      await writeRequestFile(await loadProject(job.slug));
      await fs.mkdir(params.targetDir!, { recursive: true });
      await writeMotion(params.targetDir!);
      await writeUi(params.targetDir!);
      await writeAtmos(params.targetDir!);
      const p = await loadProject(job.slug);
      emit(job, { type: 'step', text: `Concept: ${conceptLabel(p)}. AI đang dựng landing page (motion.js + ui.js + atmos.js có sẵn), rồi tự chụp màn hình để rà và sửa…` });
      await run();
      await afterBuild(params.targetDir!);
      return;
    }

    case 'quick-revise': {
      let text = params.feedback?.trim() ?? '';
      if (!text) {
        // Không có góp ý → sửa theo báo cáo QA gần nhất
        const file = path.join(params.targetDir!, QA_JSON);
        const report = existsSync(file) ? (JSON.parse(await fs.readFile(file, 'utf8')) as QaReport) : null;
        const issues = report?.issues.filter((i) => i.severity !== 'minor' || i.category === 'Bố cục dồn giữa') ?? [];
        if (!issues.length) throw new Error('Không có góp ý và báo cáo QA không còn lỗi cần sửa.');
        text = 'Sửa các lỗi QA tự động phát hiện:\n' + issues.map((i) => `- [${i.category}] ${i.page ?? ''}${i.viewport ? ` (${i.viewport})` : ''}: ${i.message}`).join('\n');
      }
      const scope = params.section?.trim();
      // Phạm vi một section: AI chỉ đọc / sửa / chụp lại khối đó — nhanh hơn nhiều so với cả trang
      const scopeLine = scope
        ? `\n## Phạm vi\n\nCHỈ sửa section \`#${scope}\` trong index.html (kèm CSS / JS riêng của khối nếu cần). Không đổi các section khác.\n`
        : '';
      await fs.writeFile(path.join(dir, 'feedback.md'), `# Góp ý cần sửa\n${scopeLine}\n${text}\n`, 'utf8');
      await writeMotion(params.targetDir!);
      await writeUi(params.targetDir!);
      await writeAtmos(params.targetDir!);
      emit(job, { type: 'step', text: scope ? `AI đang sửa section #${scope} theo góp ý…` : 'AI đang sửa landing page theo góp ý (có chụp màn hình kiểm lại)…' });
      await run();
      await updateProject(job.slug, (pr) => {
        const t = params.feedback?.trim() || 'Sửa theo báo cáo QA';
        pr.revisions = [...(pr.revisions ?? []), { createdAt: new Date().toISOString(), text: scope ? `[#${scope}] ${t}` : t }];
      });
      await afterBuild(params.targetDir!);
      return;
    }

    // ---------- Luồng chuẩn: tối đa 10 câu hỏi → SRS gộp ----------
    case 'questions': {
      await writeRequestFile(await loadProject(job.slug));
      emit(job, { type: 'step', text: 'Đang soạn tối đa 10 câu hỏi then chốt…' });
      await fs.rm(path.join(dir, 'questions-business.json'), { force: true });
      await run();
      let parsed = await validateQuestions(job.slug, 'business', 'questions', StandardQuestionSetSchema);
      if (!parsed.ok) {
        emit(job, { type: 'step', text: 'Bộ câu hỏi sai định dạng, đang yêu cầu AI sửa lại (lần 2)…' });
        await run(
          `LẦN TRƯỚC FILE questions-business.json KHÔNG HỢP LỆ:\n${parsed.error}\n` +
            `Chỉ sửa lại file đó (tối đa 10 câu, đúng định dạng JSON trong references/question-guide.md).`,
        );
        parsed = await validateQuestions(job.slug, 'business', 'questions', StandardQuestionSetSchema);
        if (!parsed.ok) throw new Error(`AI trả về bộ câu hỏi sai định dạng sau 2 lần thử:\n${parsed.error}`);
      }
      const set = parsed.value;
      await updateProject(job.slug, (pr) => {
        pr.business = { questions: set, answers: {}, currentIndex: 0, followupStatus: 'skipped' };
        pr.screen = 'business-qa';
      });
      emit(job, { type: 'step', text: `Đã tạo ${set.groups.reduce((s, g) => s + g.questions.length, 0)} câu hỏi.` });
      return;
    }

    case 'srs': {
      await writeAnswersFile(await loadProject(job.slug), 'business');
      await fs.mkdir(srsDir(job.slug), { recursive: true });
      const before = await snapshotSrs(job.slug);
      emit(job, { type: 'step', text: 'Đang viết SRS gộp (nghiệp vụ + giao diện + design tokens) trong một lượt…' });
      await runAs('srs');
      const registryErrors = await finishRegistry('ui', 'srs');
      const changes = await diffSrs(job.slug, before);
      const srs = srsDir(job.slug);
      for (const need of ['README.md', '09-ui-ux/03-screen-inventory.md'])
        if (!existsSync(path.join(srs, need))) throw new Error(`AI chưa tạo srs/${need}. Hãy thử chạy lại.`);
      // Chỉ kiểm bằng code (không tốn lượt AI). Rà soát bằng AI: bấm "Rà soát lại" ở tab Rà soát khi cần.
      const review = buildReview(await codeReview(srs, 'ui'), [], { status: 'skipped' });
      await writeReview(srs, review);
      await updateProject(job.slug, (pr) => {
        pr.srsChanges = changes;
        pr.screen = 'ui-review';
        pr.registryErrors = registryErrors;
        pr.review = reviewSummary(review);
      });
      emit(job, { type: 'step', text: `Hoàn tất: ${changes.length} file SRS · kiểm bằng code: ${review.findings.length} vấn đề.` });
      return;
    }

    case 'prototype-qa':
      await runQaStep({ failSoft: false });
      return;

    case 'prototype-fix': {
      if (srsMode === 'registry') await writeMotion(params.targetDir!);
      emit(job, { type: 'step', text: 'AI đang sửa các lỗi trong báo cáo QA…' });
      await run();
      const pages = await listPages(params.targetDir!);
      await updateProject(job.slug, (pr) => void (pr.prototype = { ...pr.prototype, builtAt: new Date().toISOString(), pages }));
      await runQaStep({ failSoft: false });
      return;
    }

    case 'srs-review':
      await runReview({ failSoft: false });
      return;

    case 'srs-fix': {
      // AI sửa trên bản nháp (_fix/), BA xem thay đổi rồi mới áp dụng
      const srs = srsDir(job.slug);
      const review = await readReview(srs);
      const finding = review?.findings.find((f) => f.id === params.findingId);
      if (!finding) throw new Error('Không tìm thấy lỗi rà soát cần sửa. Hãy bấm "Rà soát lại".');
      const draft = fixDir(job.slug);
      await fs.rm(draft, { recursive: true, force: true });
      for (const rel of await listAll(srs)) {
        const to = path.join(draft, 'srs', rel);
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.copyFile(path.join(srs, rel), to);
      }
      for (const f of ['request.md', 'answers-business.md', 'answers-ui.md'])
        if (existsSync(path.join(dir, f))) await fs.copyFile(path.join(dir, f), path.join(draft, f));
      emit(job, { type: 'step', text: `AI đang sửa ${finding.id} trên bản nháp: ${finding.message}` });
      await runAs('srs-fix', `LỖI CẦN SỬA (${finding.id}):
${JSON.stringify(finding, null, 2)}`, draft);
      const diffs = await diffDirs(srs, path.join(draft, 'srs'), 'hien-tai', 'de-xuat');
      if (diffs.length === 0) throw new Error('AI không thay đổi file nào cho lỗi này. Có thể lỗi cần BA quyết định — hãy sửa tay hoặc hỏi lại khách.');
      await updateProject(job.slug, (pr) => void (pr.pendingFix = { findingId: finding.id, createdAt: new Date().toISOString() }));
      emit(job, { type: 'step', text: `AI đề xuất thay đổi ${diffs.length} file. Hãy xem lại trước khi lưu.` });
      return;
    }

    case 'business-questions':
    case 'ui-questions': {
      const phase: Phase = job.kind === 'business-questions' ? 'business' : 'ui';
      const p = await loadProject(job.slug);
      if (phase === 'business') await writeRequestFile(p);
      emit(job, { type: 'step', text: 'Đang tạo bộ câu hỏi…' });
      await fs.rm(path.join(dir, `questions-${phase}.json`), { force: true });
      await run();
      // Kiểm tra JSON bằng zod; sai định dạng thì cho AI sửa lại 1 lần.
      let parsed = await validateQuestions(job.slug, phase);
      if (!parsed.ok) {
        emit(job, { type: 'step', text: 'Bộ câu hỏi sai định dạng, đang yêu cầu AI sửa lại (lần 2)…' });
        await run(
          `LẦN TRƯỚC FILE questions-${phase}.json KHÔNG HỢP LỆ:\n${parsed.error}\n` +
            `Hãy ghi lại file đó đúng định dạng JSON trong references/question-guide.md.`,
        );
        parsed = await validateQuestions(job.slug, phase);
        if (!parsed.ok) throw new Error(`AI trả về bộ câu hỏi sai định dạng sau 2 lần thử:\n${parsed.error}`);
      }
      const set = parsed.value;
      await updateProject(job.slug, (pr) => {
        pr[phase] = { questions: set, answers: {}, currentIndex: 0 };
        pr.screen = phase === 'business' ? 'business-qa' : 'ui-qa';
      });
      const n = set.groups.reduce((s, g) => s + g.questions.length, 0);
      emit(job, { type: 'step', text: `Đã tạo ${n} câu hỏi.` });
      return;
    }

    case 'business-followup':
    case 'ui-followup': {
      const phase: Phase = job.kind === 'business-followup' ? 'business' : 'ui';
      const p = await loadProject(job.slug);
      await writeAnswersFile(p, phase);
      emit(job, { type: 'step', text: 'AI đang rà soát câu trả lời: tìm chỗ thiếu, mơ hồ, mâu thuẫn…' });
      await fs.rm(path.join(dir, `followup-${phase}.json`), { force: true });
      await run();
      let parsed = await validateQuestions(job.slug, phase, 'followup');
      if (!parsed.ok) {
        emit(job, { type: 'step', text: 'Câu hỏi bổ sung sai định dạng, đang yêu cầu AI sửa lại (lần 2)…' });
        await run(
          `LẦN TRƯỚC FILE followup-${phase}.json KHÔNG HỢP LỆ:\n${parsed.error}\n` +
            `Hãy ghi lại file đó đúng định dạng trong mục "Vòng câu hỏi bổ sung" của references/question-guide.md.`,
        );
        parsed = await validateQuestions(job.slug, phase, 'followup');
        if (!parsed.ok) throw new Error(`AI trả về câu hỏi bổ sung sai định dạng sau 2 lần thử:\n${parsed.error}`);
      }
      const extra = parsed.value;
      const n = extra.groups.reduce((s, g) => s + g.questions.length, 0);
      await updateProject(job.slug, (pr) => {
        const st = pr[phase];
        st.followupStatus = 'asked';
        if (n > 0 && st.questions) st.currentIndex = appendFollowup(st.questions, extra);
      });
      if (n > 0) {
        emit(job, { type: 'step', text: `Có ${n} câu hỏi bổ sung cần khách trả lời.` });
        return;
      }
      // Không còn gì cần hỏi → viết SRS luôn trong cùng lượt
      emit(job, { type: 'step', text: 'Không có điểm nào cần hỏi thêm.' });
      await runSrs(phase);
      return;
    }

    case 'business-srs':
    case 'ui-srs':
      await runSrs(job.kind === 'business-srs' ? 'business' : 'ui');
      return;

    case 'prototype': {
      const target = params.targetDir!;
      let expectedScreens: { id: string; path: string }[] = [];
      if (srsMode === 'registry') {
        // Nền móng do code sinh từ SRS: tokens (Tailwind + CSS) và sprite icon — AI dựng phần còn lại trên đó
        const written = await writeFoundation(target, srsDir(job.slug));
        emit(job, { type: 'step', text: `Đã sinh từ design tokens: ${written.join(', ')}.` });
        const runtime = await writeRuntime(target, srsDir(job.slug), loaded.name, job.slug);
        expectedScreens = runtime.screens;
        emit(job, { type: 'step', text: `Đã sinh từ phân quyền + vòng đời chứng từ: ${runtime.files.join(', ')}.` });
      }
      emit(job, { type: 'step', text: `Đang dựng prototype vào ${target}…` });
      await run();
      const pages = await listPages(target);
      if (!pages.includes('index.html')) throw new Error('AI chưa tạo index.html trong folder prototype. Hãy thử chạy lại.');
      if (srsMode === 'registry') {
        if (!pages.includes('components.html')) emit(job, { type: 'step', text: 'Cảnh báo: chưa có trang style guide components.html.' });
        const missing = expectedScreens.filter((s) => !pages.includes(s.path));
        if (missing.length)
          emit(job, {
            type: 'step',
            text: `Cảnh báo: còn ${missing.length} màn hình trong SRS chưa có trang — ${missing.slice(0, 6).map((s) => `${s.id} (${s.path})`).join(', ')}${missing.length > 6 ? '…' : ''}.`,
          });
        const hard = await scanHardcoded(target, pages);
        if (hard.length) {
          const total = hard.reduce((s, h) => s + h.count, 0);
          emit(job, {
            type: 'step',
            text: `Cảnh báo: ${total} chỗ dùng giá trị viết cứng (mã màu HEX / class kiểu text-[13px]) thay vì token — ${hard
              .slice(0, 5)
              .map((h) => `${h.file} (${h.count})`)
              .join(', ')}${hard.length > 5 ? '…' : ''}.`,
          });
        }
      }
      await updateProject(job.slug, (pr) => {
        pr.prototype = { dir: target, builtAt: new Date().toISOString(), pages };
        pr.screen = 'done';
      });
      emit(job, { type: 'step', text: `Đã dựng ${pages.length} trang.` });
      if (srsMode === 'registry') await runQaStep({ failSoft: true });
      return;
    }
  }
}

async function validateQuestions(
  slug: string,
  phase: Phase,
  kind: 'questions' | 'followup' = 'questions',
  schema: typeof QuestionSetSchema | typeof FollowupSetSchema | typeof StandardQuestionSetSchema = kind === 'followup' ? FollowupSetSchema : QuestionSetSchema,
) {
  try {
    const raw = await readQuestionsFile(slug, phase, kind);
    const r = schema.safeParse(raw);
    if (r.success) return { ok: true as const, value: normalizeQuestions(r.data) };
    const error = r.error.issues
      .slice(0, 15)
      .map((i) => `- ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    return { ok: false as const, error };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}
