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
  listProjects,
  listSrsFiles,
  loadProject,
  resolveSrsPath,
  saveProject,
  srsDir,
  updateProject,
} from './projects.js';
import { attachClient, getJob, reconcileJob, retryLastJob, startJob } from './jobs.js';
import { checkWritable, listDir, makeDir } from './fsbrowse.js';
import { SaveAnswersSchema, type Screen } from './schemas.js';

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
  const { name } = z.object({ name: z.string().trim().min(1, 'Hãy nhập tên dự án').max(120) }).parse(req.body);
  res.json(await createProject(name));
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

app.post('/api/projects/:slug/request', h(async (req, res) => {
  const { request } = z.object({ request: z.string().trim().min(10, 'Yêu cầu quá ngắn') }).parse(req.body);
  const slug = param(req, 'slug');
  await requireLogin();
  await updateProject(slug, (p) => void (p.request = request));
  res.json({ jobId: await startJob(slug, 'business-questions') });
}));

app.post('/api/projects/:slug/jobs', h(async (req, res) => {
  const body = z
    .object({
      kind: z.enum(['business-questions', 'business-srs', 'ui-questions', 'ui-srs', 'prototype']),
      targetDir: z.string().optional(),
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
  res.json({ jobId: await startJob(slug, body.kind, { targetDir }) });
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
  const p = await loadProject(param(req, 'slug'));
  p[phase].answers = body.answers;
  p[phase].currentIndex = body.currentIndex;
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
  zip.directory(dir, 'srs');
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
  // Kiểm tra Claude Code ngay khi khởi động
  checkAuth(true).then((st) => {
    console.log(`[server] Lệnh claude: ${st.cli.installed ? st.cli.version : 'không tìm thấy trong PATH'}`);
    console.log(`[server] Tài khoản Claude: ${st.account.loggedIn ? `đã đăng nhập (${st.account.subscriptionType ?? 'không rõ gói'})` : 'CHƯA đăng nhập'}`);
    if (st.envApiKey) console.warn('[server] CẢNH BÁO: đang có biến ANTHROPIC_API_KEY — SDK có thể dùng API key thay vì tài khoản Claude.');
  });
});
