// Quản lý tác vụ AI chạy nền + phát tiến độ qua SSE.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { AgentError, runSkill, type AgentEvent } from './agent.js';
import {
  HttpError,
  appendFollowup,
  diffSrs,
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
import { FollowupSetSchema, QuestionSetSchema, projectTypeOf, usesRegistry, type JobKind, type Phase, type Project } from './schemas.js';
import { checkRegistry, writeGenerated } from './registry.js';

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

export async function startJob(slug: string, kind: JobKind, params: { targetDir?: string } = {}): Promise<string> {
  const p = await loadProject(slug);
  if (p.job?.status === 'running' && jobs.has(p.job.id)) throw new HttpError(409, 'Dự án đang có tác vụ AI chạy.');

  const job: Job = { id: randomUUID(), slug, kind, status: 'running', events: [], clients: new Set(), abort: new AbortController() };
  jobs.set(job.id, job);
  await updateProject(slug, (pr) => {
    pr.job = { id: job.id, kind, status: 'running', targetDir: params.targetDir };
  });

  // Chạy nền, không chờ
  void runJob(job, params).then(
    async () => {
      job.status = 'done';
      await updateProject(slug, (pr) => {
        pr.job = { id: job.id, kind, status: 'done', targetDir: params.targetDir };
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
        pr.job = { id: job.id, kind, status: 'error', error: message, errorCode, resetsAt, targetDir: params.targetDir };
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
  return startJob(slug, p.job.kind, { targetDir: p.job.targetDir });
}

function closeClients(job: Job) {
  for (const res of job.clients) res.end();
  job.clients.clear();
  // Giữ lịch sử sự kiện 30 phút để trình duyệt kết nối lại
  setTimeout(() => jobs.delete(job.id), 30 * 60 * 1000).unref();
}

async function runJob(job: Job, params: { targetDir?: string }) {
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
  const runAs = (mode: JobKind, extra?: string) =>
    runSkill({ mode, projectType, srsMode, projectDir: dir, targetDir: params.targetDir, extra, onEvent, signal: job.abort.signal });
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
   * Kiểm tra registry + phân quyền; sai thì cho AI sửa đúng các lỗi đó một lần.
   * Sau đó sinh Phần 12 và bảng 4.2 bằng code. Trả về lỗi còn lại (không chặn kết quả SRS).
   */
  const finishRegistry = async (phase: Phase, mode: JobKind): Promise<string[]> => {
    const srs = srsDir(job.slug);
    emit(job, { type: 'step', text: 'Đang kiểm tra sổ đăng ký mã (_registry.json) và ma trận phân quyền…' });
    let check = await checkRegistry(srs, phase);
    if (!check.ok) {
      emit(job, { type: 'step', text: `Registry có ${check.errors.length} lỗi, đang yêu cầu AI sửa…` });
      await runAs(
        mode,
        `SỬA REGISTRY: SRS đã viết xong. Chỉ sửa các lỗi dưới đây trong srs/_registry.json, srs/_permissions.json ` +
          `(và file SRS liên quan nếu lỗi do thiếu file / thiếu mã). Không viết lại SRS. Định dạng: references/registry-guide.md.\n` +
          check.errors.map((e) => `- ${e}`).join('\n'),
      );
      check = await checkRegistry(srs, phase);
    }
    const written = await writeGenerated(srs, check, { uiDone: phase === 'ui' });
    if (written.length) emit(job, { type: 'step', text: `Đã sinh tự động: ${written.join(', ')}.` });
    if (!check.ok) emit(job, { type: 'step', text: `Registry còn ${check.errors.length} lỗi — xem cảnh báo ở màn hình SRS.` });
    return check.errors;
  };

  switch (job.kind) {
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
      emit(job, { type: 'step', text: `Đang dựng prototype vào ${target}…` });
      await run();
      const pages = (await fs.readdir(target)).filter((f) => f.toLowerCase().endsWith('.html')).sort();
      if (!pages.includes('index.html')) throw new Error('AI chưa tạo index.html trong folder prototype. Hãy thử chạy lại.');
      await updateProject(job.slug, (pr) => {
        pr.prototype = { dir: target, builtAt: new Date().toISOString(), pages };
        pr.screen = 'done';
      });
      emit(job, { type: 'step', text: `Hoàn tất: ${pages.length} trang.` });
      return;
    }
  }
}

async function validateQuestions(slug: string, phase: Phase, kind: 'questions' | 'followup' = 'questions') {
  try {
    const raw = await readQuestionsFile(slug, phase, kind);
    const r = (kind === 'followup' ? FollowupSetSchema : QuestionSetSchema).safeParse(raw);
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
