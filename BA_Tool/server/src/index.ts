// Express server: API dự án, câu hỏi, SRS, duyệt folder, tác vụ AI (SSE), xem trước prototype.
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ZipArchive } from 'archiver';
import { z } from 'zod';
import { MODEL, PORT } from './config.js';
import { checkAuth } from './auth.js';
import {
  HttpError,
  createProject,
  fixDir,
  listProjects,
  listSrsFiles,
  loadProject,
  quickPrototypeDir,
  resolveSrsPath,
  saveProject,
  srsDir,
  updateProject,
} from './projects.js';
import { attachClient, getJob, reconcileJob, retryLastJob, startJob } from './jobs.js';
import { checkWritable, listDir, makeDir } from './fsbrowse.js';
import { checkRegistry, writeGenerated } from './registry.js';
import { checkDesignTokens } from './design.js';
import { buildReview, codeReview, readReview, reviewSummary, writeReview } from './review.js';
import { diffDirs, isClientFile, listAll, listVersions, lockVersion, versionRoot } from './versions.js';
import { QA_JSON } from './qa.js';
import { probeImages, providerChain } from './images.js';
import { ConceptSchema, QuickStartSchema, presetSummaries, quickCatalog, writePresetCatalog } from './presets.js';
import { FLOWS, JOB_KINDS, PROJECT_TYPES, SaveAnswersSchema, type Screen } from './schemas.js';

const app = express();
app.use(express.json({ limit: '5mb' }));

/** Bọc handler async để lỗi đi vào middleware xử lý lỗi. */
const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const param = (req: Request, k: string) => String(req.params[k]);

// ---------- Kiểm tra Claude Code (đã cài / đã đăng nhập) ----------

app.get('/api/auth-status', h(async (_req, res) => {
  res.json({ ...(await checkAuth()), model: MODEL });
}));

/** Nút "Kiểm tra lại" trên màn hình hướng dẫn */
app.post('/api/auth-status/recheck', h(async (_req, res) => {
  res.json({ ...(await checkAuth(true)), model: MODEL });
}));

/** Chặn tác vụ AI khi chưa đăng nhập tài khoản Claude. */
async function requireLogin() {
  const st = await checkAuth();
  if (!st.ready) {
    throw new HttpError(412, 'Chưa đăng nhập Claude Code. Chạy `claude` trong terminal để đăng nhập bằng tài khoản Claude, rồi bấm "Kiểm tra lại".');
  }
}

// ---------- Dự án ----------

app.get('/api/projects', h(async (_req, res) => {
  res.json((await listProjects()).map(reconcileJob));
}));

app.post('/api/projects', h(async (req, res) => {
  const { name, projectType, flow } = z
    .object({
      name: z.string().trim().min(1, 'Hãy nhập tên dự án').max(120),
      flow: z.enum(FLOWS, { message: 'Hãy chọn chế độ' }),
      // Chế độ nhanh luôn là landing page nên không cần loại dự án
      projectType: z.enum(PROJECT_TYPES, { message: 'Hãy chọn loại dự án' }).optional(),
    })
    .refine((b) => b.flow === 'quick' || b.projectType, { message: 'Hãy chọn loại dự án', path: ['projectType'] })
    .parse(req.body);
  res.json(await createProject(name, projectType ?? 'website', flow));
}));

app.get('/api/projects/:slug', h(async (req, res) => {
  res.json(reconcileJob(await loadProject(param(req, 'slug'))));
}));

/** Chuyển màn hình (ví dụ "Sang bước Giao diện"). */
app.post('/api/projects/:slug/screen', h(async (req, res) => {
  const { screen } = z
    .object({ screen: z.enum(['request', 'business-qa', 'business-review', 'ui-qa', 'ui-review', 'prototype', 'done']) })
    .parse(req.body);
  res.json(
    await updateProject(param(req, 'slug'), (p) => {
      p.screen = screen as Screen;
      // Chuyển bước thì bỏ thông báo lỗi của tác vụ cũ
      if (p.job?.status === 'error') p.job = null;
    }),
  );
}));

// ---------- Tác vụ AI ----------

/** Preset thiết kế cho chế độ nhanh (tên, mô tả, màu mẫu, từ khóa nhận diện) */
app.get('/api/presets', (_req, res) => {
  res.json(presetSummaries());
});

/** Danh mục cho màn hình cấu hình Quick Create: preset, section, ngôn ngữ, giới hạn độ dài */
app.get('/api/quick-catalog', (_req, res) => {
  res.json(quickCatalog());
});

/** Lưu nháp cấu hình website (tự lưu khi BA nhập) — quay lại / tải lại trang không mất dữ liệu */
app.put('/api/projects/:slug/concept', h(async (req, res) => {
  const concept = ConceptSchema.parse(req.body?.concept ?? {});
  const p = await updateProject(param(req, 'slug'), (pr) => {
    if (pr.flow !== 'quick') throw new HttpError(400, 'Chỉ dùng cho dự án chế độ nhanh.');
    pr.concept = concept;
  });
  res.json({ ok: true, updatedAt: p.updatedAt });
}));

app.post('/api/projects/:slug/request', h(async (req, res) => {
  const slug = param(req, 'slug');
  const current = await loadProject(slug);
  if (current.flow === 'quick') {
    // Chế độ nhanh: cấu hình đầy đủ là dữ liệu chính; chủ đề + thương hiệu bắt buộc
    const concept = QuickStartSchema.parse(req.body?.concept ?? {});
    await requireLogin();
    await updateProject(slug, (pr) => {
      pr.concept = concept;
      pr.request = concept.topic;
    });
    res.json({ jobId: await startJob(slug, 'quick-prototype', { targetDir: quickPrototypeDir(slug) }) });
    return;
  }
  const { request } = z.object({ request: z.string().trim().min(10, 'Yêu cầu quá ngắn') }).parse(req.body);
  await requireLogin();
  const p = await updateProject(slug, (pr) => {
    pr.request = request;
  });
  res.json({ jobId: await startJob(slug, p.flow === 'standard' ? 'questions' : 'business-questions') });
}));

app.post('/api/projects/:slug/jobs', h(async (req, res) => {
  const body = z
    .object({
      kind: z.enum(JOB_KINDS),
      targetDir: z.string().optional(),
      findingId: z.string().optional(),
      feedback: z.string().trim().max(8000).optional(),
      /** quick-revise: chỉ sửa trong section này */
      section: z.string().trim().regex(/^[\w-]{1,80}$/, 'Section không hợp lệ').optional(),
      /** quick-revise: trang đang xem / chứa section */
      page: z
        .string()
        .trim()
        .regex(/^[\w-]+(\/[\w-]+)*\.html$/, 'Trang không hợp lệ')
        .optional(),
    })
    .parse(req.body);
  const slug = param(req, 'slug');
  await requireLogin();
  let targetDir: string | undefined;
  if (body.kind === 'prototype') {
    if (!body.targetDir) throw new HttpError(400, 'Hãy chọn folder đích');
    targetDir = path.resolve(body.targetDir);
    const w = await checkWritable(targetDir);
    if (!w.ok) throw new HttpError(400, w.error!);
    if (!existsSync(path.join(srsDir(slug), '09-ui-ux', '03-screen-inventory.md'))) {
      throw new HttpError(400, 'Chưa có SRS giao diện (09-ui-ux). Hãy hoàn tất bước Giao diện trước.');
    }
  }
  if (body.kind === 'quick-revise') {
    const p = await loadProject(slug);
    if (p.flow !== 'quick') throw new HttpError(400, 'Chỉ dùng cho dự án chế độ nhanh.');
    if (!p.prototype.dir || !existsSync(p.prototype.dir)) throw new HttpError(400, 'Chưa có prototype. Hãy gửi mô tả để dựng trước.');
    targetDir = p.prototype.dir;
  }
  if (body.kind === 'srs' && !(await loadProject(slug)).business.questions) throw new HttpError(400, 'Chưa có bộ câu hỏi.');
  if (body.kind === 'prototype-qa' || body.kind === 'prototype-fix') {
    const p = await loadProject(slug);
    if (!p.prototype.dir || !existsSync(p.prototype.dir)) throw new HttpError(400, 'Chưa có prototype. Hãy dựng prototype trước.');
    if (!p.projectType) throw new HttpError(400, 'QA tự động chỉ áp dụng cho dự án tạo mới (có loại dự án).');
    targetDir = p.prototype.dir;
  }
  if (body.kind === 'srs-fix') {
    if (!body.findingId) throw new HttpError(400, 'Thiếu mã lỗi cần sửa');
    if ((await loadProject(slug)).pendingFix) throw new HttpError(409, 'Đang có một bản sửa chờ xem. Hãy lưu hoặc bỏ bản sửa đó trước.');
  }
  res.json({ jobId: await startJob(slug, body.kind, { targetDir, findingId: body.findingId, feedback: body.feedback, section: body.section, page: body.page }) });
}));

/** "Chạy lại bước này" — chạy lại tác vụ lỗi gần nhất (ví dụ sau khi chạm giới hạn sử dụng). */
app.post('/api/projects/:slug/jobs/retry', h(async (req, res) => {
  const slug = param(req, 'slug');
  await requireLogin();
  const p = await loadProject(slug);
  if (p.job?.kind === 'prototype' && p.job.targetDir) {
    const w = await checkWritable(p.job.targetDir);
    if (!w.ok) throw new HttpError(400, w.error!);
  }
  res.json({ jobId: await retryLastJob(slug) });
}));

app.get('/api/jobs/:id/events', (req, res) => {
  const job = getJob(param(req, 'id'));
  if (!job) {
    res.status(404).json({ error: 'Không tìm thấy tác vụ (có thể server đã khởi động lại).' });
    return;
  }
  attachClient(job, res);
});

// ---------- Câu trả lời ----------

app.put('/api/projects/:slug/answers/:phase', h(async (req, res) => {
  const phase = z.enum(['business', 'ui']).parse(param(req, 'phase'));
  const body = SaveAnswersSchema.parse(req.body);
  const p = reconcileJob(await loadProject(param(req, 'slug')));
  // AI đang chạy (ví dụ vòng bổ sung sắp gắn thêm câu hỏi): bỏ qua lần lưu muộn từ trình duyệt
  // (lưu khi rời trang) để không ghi đè vị trí câu hỏi do tác vụ cập nhật.
  if (p.job?.status === 'running') {
    res.json({ ok: true, skipped: true });
    return;
  }
  p[phase].answers = body.answers;
  p[phase].currentIndex = body.currentIndex;
  if (body.notes) p[phase].notes = body.notes;
  await saveProject(p);
  res.json({ ok: true });
}));

// ---------- SRS ----------

app.get('/api/projects/:slug/srs', h(async (req, res) => {
  res.json(await listSrsFiles(param(req, 'slug')));
}));

app.get('/api/projects/:slug/srs/file', h(async (req, res) => {
  const full = resolveSrsPath(param(req, 'slug'), String(req.query.path || ''));
  if (!existsSync(full)) throw new HttpError(404, 'Không tìm thấy file');
  res.json({ content: await fs.readFile(full, 'utf8') });
}));

app.put('/api/projects/:slug/srs/file', h(async (req, res) => {
  const { path: rel, content } = z.object({ path: z.string(), content: z.string() }).parse(req.body);
  const full = resolveSrsPath(param(req, 'slug'), rel);
  if (!existsSync(full)) throw new HttpError(404, 'Không tìm thấy file');
  await fs.writeFile(full, content, 'utf8');
  res.json({ ok: true });
}));

app.get('/api/projects/:slug/srs.zip', h(async (req, res) => {
  const slug = param(req, 'slug');
  const dir = srsDir(slug);
  if (!existsSync(dir)) throw new HttpError(404, 'Chưa có SRS');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-srs.zip"`);
  const zip = new ZipArchive({ zlib: { level: 9 } });
  zip.on('error', (e: Error) => res.destroy(e));
  zip.pipe(res);
  zip.glob('**/*', { cwd: dir, ignore: ['_versions/**'] }, { prefix: 'srs' });
  await zip.finalize();
}));

/** Tải toàn bộ prototype (bỏ file QA nội bộ) để gửi khách / đội frontend. */
app.get('/api/projects/:slug/prototype.zip', h(async (req, res) => {
  const slug = param(req, 'slug');
  const p = await loadProject(slug);
  if (!p.prototype.dir || !existsSync(p.prototype.dir)) throw new HttpError(404, 'Chưa có prototype');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-prototype.zip"`);
  const zip = new ZipArchive({ zlib: { level: 9 } });
  zip.on('error', (e: Error) => res.destroy(e));
  zip.pipe(res);
  zip.glob('**/*', { cwd: p.prototype.dir, ignore: ['_qa/**', '_qa-report.md', 'node_modules/**', '.git/**'] }, { prefix: 'prototype' });
  await zip.finalize();
}));

// ---------- QA prototype ----------

app.get('/api/projects/:slug/qa', h(async (req, res) => {
  const p = await loadProject(param(req, 'slug'));
  const file = p.prototype.dir ? path.join(p.prototype.dir, QA_JSON) : '';
  res.json(file && existsSync(file) ? JSON.parse(await fs.readFile(file, 'utf8')) : null);
}));

// ---------- Rà soát SRS ----------

app.get('/api/projects/:slug/review', h(async (req, res) => {
  res.json(await readReview(srsDir(param(req, 'slug'))));
}));

/** Bản sửa AI đề xuất (chờ BA xem): lỗi được sửa + diff từng file. */
app.get('/api/projects/:slug/fix', h(async (req, res) => {
  const slug = param(req, 'slug');
  const p = await loadProject(slug);
  if (!p.pendingFix) throw new HttpError(404, 'Không có bản sửa nào đang chờ');
  const review = await readReview(srsDir(slug));
  const finding = review?.findings.find((f) => f.id === p.pendingFix!.findingId) ?? null;
  res.json({ finding, diffs: await diffDirs(srsDir(slug), path.join(fixDir(slug), 'srs'), 'hien-tai', 'de-xuat') });
}));

/** Lưu bản sửa: chép file đã đổi vào srs/, sinh lại Phần 12 + 4.2, kiểm lại bằng code. */
app.post('/api/projects/:slug/fix/apply', h(async (req, res) => {
  const slug = param(req, 'slug');
  const p = await loadProject(slug);
  if (!p.pendingFix) throw new HttpError(404, 'Không có bản sửa nào đang chờ');
  const srs = srsDir(slug);
  const draft = path.join(fixDir(slug), 'srs');
  const diffs = await diffDirs(srs, draft, 'hien-tai', 'de-xuat');
  for (const d of diffs) {
    if (d.status === 'removed') continue; // AI không xóa file; file chỉ có ở bản hiện tại thì giữ
    await fs.mkdir(path.dirname(path.join(srs, d.path)), { recursive: true });
    await fs.copyFile(path.join(draft, d.path), path.join(srs, d.path));
  }
  const phase = existsSync(path.join(srs, '09-ui-ux', '03-screen-inventory.md')) ? 'ui' : 'business';
  const check = await checkRegistry(srs, phase);
  await writeGenerated(srs, check, { uiDone: phase === 'ui' });
  const tokenErrors = phase === 'ui' ? await checkDesignTokens(srs) : [];
  // Gộp: kiểm bằng code chạy lại; kết quả AI cũ giữ nguyên, lỗi vừa sửa (nếu do AI phát hiện) đánh dấu đã sửa
  const old = await readReview(srs);
  const ai = (old?.findings ?? [])
    .filter((f) => f.source === 'ai')
    .map(({ id, source: _s, ...f }) => (id === p.pendingFix!.findingId ? { ...f, status: 'fixed' as const } : f));
  const review = buildReview(await codeReview(srs, phase), ai, old?.ai ?? { status: 'skipped' });
  await writeReview(srs, review);
  await fs.rm(fixDir(slug), { recursive: true, force: true });
  res.json(
    await updateProject(slug, (pr) => {
      pr.pendingFix = null;
      pr.review = reviewSummary(review);
      pr.registryErrors = [...check.errors, ...tokenErrors];
      pr.srsChanges = diffs.filter((d) => d.status !== 'removed').map((d) => ({ path: d.path, kind: d.status === 'added' ? 'new' : 'modified' }));
    }),
  );
}));

app.post('/api/projects/:slug/fix/discard', h(async (req, res) => {
  const slug = param(req, 'slug');
  await fs.rm(fixDir(slug), { recursive: true, force: true });
  res.json(await updateProject(slug, (pr) => void (pr.pendingFix = null)));
}));

// ---------- Phiên bản ----------

app.get('/api/projects/:slug/versions', h(async (req, res) => {
  const slug = param(req, 'slug');
  const p = await loadProject(slug);
  const meta = new Map((p.versions ?? []).map((v) => [v.id, v]));
  res.json((await listVersions(srsDir(slug))).map((id) => meta.get(id) ?? { id, createdAt: '', note: '' }));
}));

/** Chốt phiên bản: ghi 0.3 / 0.5 rồi chụp srs/ vào srs/_versions/vX.Y/. */
app.post('/api/projects/:slug/versions', h(async (req, res) => {
  const slug = param(req, 'slug');
  const { note } = z.object({ note: z.string().trim().max(500).default('') }).parse(req.body);
  const p = reconcileJob(await loadProject(slug));
  if (p.job?.status === 'running') throw new HttpError(409, 'AI đang chạy, hãy chờ xong rồi chốt phiên bản.');
  if (!existsSync(srsDir(slug))) throw new HttpError(400, 'Chưa có SRS');
  const id = await lockVersion(srsDir(slug), note);
  res.json(
    await updateProject(slug, (pr) => {
      pr.versions = [...(pr.versions ?? []), { id, createdAt: new Date().toISOString(), note }];
    }),
  );
}));

app.get('/api/projects/:slug/versions/compare', h(async (req, res) => {
  const srs = srsDir(param(req, 'slug'));
  const { a, b } = z.object({ a: z.string(), b: z.string() }).parse(req.query);
  try {
    res.json(await diffDirs(versionRoot(srs, a), versionRoot(srs, b), a, b));
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
}));

/** Gói gửi khách: chỉ các file .md nội dung SRS (không có file rà soát, registry, ghi chú BA). */
app.get('/api/projects/:slug/export.zip', h(async (req, res) => {
  const slug = param(req, 'slug');
  const version = String(req.query.version || 'current');
  let root: string;
  try {
    root = versionRoot(srsDir(slug), version);
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
  const files = (await listAll(root)).filter(isClientFile);
  if (!files.length) throw new HttpError(404, 'Chưa có file SRS để xuất');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-srs-${version === 'current' ? 'hien-tai' : version}.zip"`);
  const zip = new ZipArchive({ zlib: { level: 9 } });
  zip.on('error', (e: Error) => res.destroy(e));
  zip.pipe(res);
  for (const f of files) zip.file(path.join(root, f), { name: `srs/${f}` });
  await zip.finalize();
}));

// ---------- Duyệt folder ----------

app.get('/api/fs/list', h(async (req, res) => {
  res.json(await listDir(req.query.path ? String(req.query.path) : undefined));
}));

app.post('/api/fs/mkdir', h(async (req, res) => {
  const { parent, name } = z.object({ parent: z.string().min(1), name: z.string() }).parse(req.body);
  res.json({ path: await makeDir(parent, name) });
}));

app.get('/api/fs/check', h(async (req, res) => {
  res.json(await checkWritable(String(req.query.path || '')));
}));

// ---------- Xem trước prototype ----------

app.use('/preview/:slug', (req, res, next) => {
  loadProject(param(req, 'slug'))
    .then((p) => {
      if (!p.prototype.dir) throw new HttpError(404, 'Chưa có prototype');
      express.static(p.prototype.dir, { index: 'index.html' })(req, res, () => {
        res.status(404).send('Không tìm thấy trang');
      });
    })
    .catch(next);
});

// ---------- Lỗi ----------

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: err.issues.map((i) => i.message).join('; ') });
  } else if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Lỗi không xác định' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] http://127.0.0.1:${PORT}  (model: ${MODEL})`);
  // Danh mục preset cho AI (references/presets.md) luôn khớp với presets.ts
  writePresetCatalog().catch((e) => console.warn('[server] Không ghi được presets.md:', e instanceof Error ? e.message : e));
  // Kiểm tra nguồn ảnh ngay khi khởi động: khóa API hỏng hiện rõ ở đây thay vì âm thầm làm website thiếu ảnh
  probeImages().then((r) => {
    const skipped = r.attempts.filter((a) => a.error).map((a) => `${a.provider}: ${a.error}`);
    if (r.ok) console.log(`[server] Nguồn ảnh: ${providerChain().join(' → ')} — đang dùng ${r.provider}${skipped.length ? ` (bỏ qua ${skipped.join('; ')})` : ''}`);
    else console.warn(`[server] CẢNH BÁO: không tìm được ảnh từ nguồn nào (${r.error}). Website sẽ được dựng với bố cục không ảnh.`);
  });
  // Kiểm tra Claude Code ngay khi khởi động
  checkAuth(true).then((st) => {
    console.log(`[server] Lệnh claude: ${st.cli.installed ? st.cli.version : 'không tìm thấy trong PATH'}`);
    console.log(`[server] Tài khoản Claude: ${st.account.loggedIn ? `đã đăng nhập (${st.account.subscriptionType ?? 'không rõ gói'})` : 'CHƯA đăng nhập'}`);
    if (st.envApiKey) console.warn('[server] CẢNH BÁO: đang có biến ANTHROPIC_API_KEY — SDK có thể dùng API key thay vì tài khoản Claude.');
  });
});
