// Lưu trữ dự án trên ổ đĩa: workspace/<slug>/project.json và srs/.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { WORKSPACE_DIR } from './config.js';
import type { Answer, Phase, Project, QuestionSet } from './schemas.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Chuyển tên tiếng Việt thành slug an toàn cho tên thư mục. */
export function slugify(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'du-an';
}

export function projectDir(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new HttpError(400, 'Mã dự án không hợp lệ');
  return path.join(WORKSPACE_DIR, slug);
}

export const srsDir = (slug: string) => path.join(projectDir(slug), 'srs');

const projectFile = (slug: string) => path.join(projectDir(slug), 'project.json');

export async function listProjects(): Promise<Project[]> {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  const entries = await fs.readdir(WORKSPACE_DIR, { withFileTypes: true });
  const out: Project[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || !existsSync(path.join(WORKSPACE_DIR, e.name, 'project.json'))) continue;
    try {
      out.push(await loadProject(e.name));
    } catch {
      /* bỏ qua dự án hỏng */
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadProject(slug: string): Promise<Project> {
  const file = projectFile(slug);
  if (!existsSync(file)) throw new HttpError(404, 'Không tìm thấy dự án');
  return JSON.parse(await fs.readFile(file, 'utf8')) as Project;
}

/** Ghi project.json an toàn (ghi file tạm rồi đổi tên). */
export async function saveProject(p: Project): Promise<Project> {
  p.updatedAt = new Date().toISOString();
  const file = projectFile(p.slug);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(p, null, 2), 'utf8');
  await fs.rename(tmp, file);
  return p;
}

export async function updateProject(slug: string, fn: (p: Project) => void | Promise<void>): Promise<Project> {
  const p = await loadProject(slug);
  await fn(p);
  return saveProject(p);
}

export async function createProject(name: string): Promise<Project> {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  const base = slugify(name);
  let slug = base;
  for (let i = 2; existsSync(path.join(WORKSPACE_DIR, slug)); i++) slug = `${base}-${i}`;
  const now = new Date().toISOString();
  const empty = () => ({ questions: null, answers: {}, currentIndex: 0 });
  const p: Project = {
    slug,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    screen: 'request',
    request: '',
    business: empty(),
    ui: empty(),
    srsChanges: [],
    prototype: { dir: null, builtAt: null, pages: [] },
    job: null,
  };
  return saveProject(p);
}

/** Ghi yêu cầu ban đầu ra request.md để skill đọc. */
export async function writeRequestFile(p: Project) {
  await fs.writeFile(path.join(projectDir(p.slug), 'request.md'), `# Yêu cầu ban đầu của BA\n\n${p.request}\n`, 'utf8');
}

function formatAnswer(a: Answer | undefined): string {
  if (!a || a.status === 'skipped') return '**Chưa rõ / Bỏ qua** → cần ghi [CẦN XÁC NHẬN]';
  const vals = Array.isArray(a.value) ? a.value : [a.value];
  const parts = vals.filter((v) => v && v !== '__other__');
  if (a.other?.trim()) parts.push(`Khác: ${a.other.trim()}`);
  return parts.length ? parts.join('; ') : '**Chưa rõ / Bỏ qua** → cần ghi [CẦN XÁC NHẬN]';
}

/** Tạo answers-<phase>.md (câu hỏi + câu trả lời) — gọn hơn JSON, tiết kiệm token. */
export async function writeAnswersFile(p: Project, phase: Phase) {
  const st = p[phase];
  if (!st.questions) throw new HttpError(400, 'Chưa có bộ câu hỏi');
  const title = phase === 'business' ? 'nghiệp vụ' : 'giao diện';
  let md = `# Câu trả lời ${title} — ${p.name}\n\n`;
  let skipped = 0;
  for (const g of st.questions.groups) {
    md += `## ${g.title}\n\n`;
    for (const q of g.questions) {
      const a = st.answers[q.id];
      if (!a || a.status === 'skipped') skipped++;
      md += `- **${q.id}** (SRS ${q.srsSections.join(', ')}): ${q.text}\n  - Trả lời: ${formatAnswer(a)}\n`;
    }
    md += '\n';
  }
  md += `---\nSố câu chưa rõ / bỏ qua: ${skipped}\n`;
  await fs.writeFile(path.join(projectDir(p.slug), `answers-${phase}.md`), md, 'utf8');
}

export async function readQuestionsFile(slug: string, phase: Phase): Promise<unknown> {
  const file = path.join(projectDir(slug), `questions-${phase}.json`);
  if (!existsSync(file)) throw new Error(`AI chưa tạo file questions-${phase}.json`);
  const raw = (await fs.readFile(file, 'utf8')).replace(/^﻿/, '').trim();
  // Phòng khi AI bọc JSON trong ```json ... ```
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(cleaned);
}

/** Bỏ các lựa chọn "Khác" do AI tự thêm — giao diện luôn tự thêm "Khác". */
export function normalizeQuestions(set: QuestionSet): QuestionSet {
  for (const g of set.groups)
    for (const q of g.questions) {
      if (q.type === 'text') q.options = [];
      else q.options = q.options.filter((o) => !/^khác\b/i.test(o.trim()));
    }
  return set;
}

// ---------- File SRS ----------

/** Chặn path traversal: chỉ cho phép file .md bên trong srs/. */
export function resolveSrsPath(slug: string, rel: string): string {
  const root = srsDir(slug);
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep) || !full.toLowerCase().endsWith('.md')) {
    throw new HttpError(400, 'Đường dẫn file SRS không hợp lệ');
  }
  return full;
}

export interface SrsFileInfo {
  path: string;
  needConfirm: number;
  proposed: number;
}

export async function listSrsFiles(slug: string): Promise<SrsFileInfo[]> {
  const root = srsDir(slug);
  if (!existsSync(root)) return [];
  const out: SrsFileInfo[] = [];
  const walk = async (dir: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.toLowerCase().endsWith('.md')) {
        const text = await fs.readFile(full, 'utf8');
        out.push({
          path: path.relative(root, full).split(path.sep).join('/'),
          needConfirm: (text.match(/\[CẦN XÁC NHẬN\]/g) || []).length,
          proposed: (text.match(/\[ĐỀ XUẤT\]/g) || []).length,
        });
      }
    }
  };
  await walk(root);
  return out.sort((a, b) => a.path.localeCompare(b.path, 'vi', { numeric: true }));
}

/** Ảnh chụp thời điểm sửa đổi của từng file SRS — dùng để biết file nào mới / đã sửa. */
export async function snapshotSrs(slug: string): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  for (const f of await listSrsFiles(slug)) {
    const st = await fs.stat(resolveSrsPath(slug, f.path));
    m.set(f.path, st.mtimeMs);
  }
  return m;
}

export async function diffSrs(slug: string, before: Map<string, number>) {
  const after = await snapshotSrs(slug);
  const changes: Project['srsChanges'] = [];
  for (const [p, t] of after) {
    if (!before.has(p)) changes.push({ path: p, kind: 'new' });
    else if (before.get(p) !== t) changes.push({ path: p, kind: 'modified' });
  }
  return changes;
}
