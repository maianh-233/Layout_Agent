// Lưu trữ dự án trên ổ đĩa: workspace/<slug>/project.json và srs/.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { WORKSPACE_DIR } from './config.js';
import { ConceptSchema, renderConcept, type BriefChecks } from './presets.js';
import {
  OTHER,
  PROJECT_TYPE_LABELS,
  projectTypeOf,
  visibleQuestionIds,
  type Answer,
  type Flow,
  type Phase,
  type Project,
  type ProjectType,
  type QuestionSet,
} from './schemas.js';

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

/** Bản nháp khi AI sửa một lỗi rà soát: _fix/srs (+ request / answers để AI tra cứu) */
export const fixDir = (slug: string) => path.join(projectDir(slug), '_fix');

/** Chế độ nhanh: prototype nằm ngay trong dự án (không cần chọn folder) */
export const quickPrototypeDir = (slug: string) => path.join(projectDir(slug), 'prototype');

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

export async function createProject(name: string, projectType: ProjectType, flow: Flow): Promise<Project> {
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  const base = slugify(name);
  let slug = base;
  for (let i = 2; existsSync(path.join(WORKSPACE_DIR, slug)); i++) slug = `${base}-${i}`;
  const now = new Date().toISOString();
  const empty = () => ({ questions: null, answers: {}, currentIndex: 0 });
  const p: Project = {
    slug,
    name: name.trim(),
    // Chế độ nhanh: website (nhiều trang), không SRS
    projectType: flow === 'quick' ? 'website' : projectType,
    // Tên dự án điền sẵn vào ô thương hiệu của màn hình cấu hình (BA sửa được)
    ...(flow === 'quick' ? { concept: ConceptSchema.parse({ brand: name.trim().slice(0, 120) }) } : {}),
    flow,
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
export async function writeRequestFile(p: Project, checks?: BriefChecks) {
  const type = projectTypeOf(p);
  const label = p.flow === 'quick' ? 'Website nhiều trang — chế độ nhanh (không có SRS)' : `${PROJECT_TYPE_LABELS[type]} (\`${type}\`)`;
  await fs.writeFile(
    path.join(projectDir(p.slug), 'request.md'),
    `# Yêu cầu ban đầu của BA\n\nLoại dự án: ${label}\n\n${p.request}\n`,
    'utf8',
  );
  // Chế độ nhanh: toàn bộ cấu hình (chủ đề, thương hiệu, mục đích, phong cách, chuyển động, ngôn ngữ, màu, font,
  // section + mô tả, chú thích nguyên văn) + kết quả kiểm tra của tool trong một file — AI đọc file này thay cho request.md
  if (p.flow === 'quick') await fs.writeFile(path.join(projectDir(p.slug), 'concept.md'), renderConcept(p.request, p.concept, checks), 'utf8');
}

/** Luồng chuẩn hỏi ít câu nên câu bỏ qua được AI tự đề xuất; luồng cũ ghi [CẦN XÁC NHẬN]. */
function formatAnswer(a: Answer | undefined, propose = false): string {
  const unknown = propose ? '**Chưa rõ / Bỏ qua** → tự đề xuất hợp lý, gắn [ĐỀ XUẤT] + ghi 13.9' : '**Chưa rõ / Bỏ qua** → cần ghi [CẦN XÁC NHẬN]';
  if (!a || a.status === 'skipped') return unknown;
  const vals = Array.isArray(a.value) ? a.value : [a.value];
  const parts = vals.filter((v) => v && v !== OTHER);
  if (a.other?.trim()) parts.push(`Khác: ${a.other.trim()}`);
  return parts.length ? parts.join('; ') : unknown;
}

/**
 * Tạo answers-<phase>.md (câu hỏi + câu trả lời) — gọn hơn JSON, tiết kiệm token.
 * Câu bị ẩn do rẽ nhánh ghi "Không áp dụng" (không tính là bỏ qua). Ghi chú BA kèm theo để AI
 * biết chỗ nào cần [CẦN XÁC NHẬN], nhưng không chép nguyên văn vào SRS.
 */
export async function writeAnswersFile(p: Project, phase: Phase) {
  const st = p[phase];
  if (!st.questions) throw new HttpError(400, 'Chưa có bộ câu hỏi');
  const title = p.flow === 'standard' ? 'của khách' : phase === 'business' ? 'nghiệp vụ' : 'giao diện';
  const visible = visibleQuestionIds(st.questions, st.answers);
  const byId = new Map(st.questions.groups.flatMap((g) => g.questions).map((q) => [q.id, q]));
  let md = `# Câu trả lời ${title} — ${p.name}\n\n`;
  if (p.flow === 'standard')
    md += '> Chỉ hỏi những điểm quyết định prototype. Phần khách chưa nói: tự bổ sung hợp lý theo ngành, gắn `[ĐỀ XUẤT]`.\n';
  md +=
    '> Ghi chú BA là nhận xét nội bộ: dùng để biết chỗ nào cần `[CẦN XÁC NHẬN]` / 13.9, không chép nguyên văn vào SRS.\n' +
    '> "Không áp dụng" = câu bị ẩn vì khách không chọn phần liên quan — không đưa phần đó vào SRS.\n\n';
  let skipped = 0;
  let hidden = 0;
  for (const g of st.questions.groups) {
    md += `## ${g.followup ? 'Câu hỏi bổ sung — ' : ''}${g.title}\n\n`;
    for (const q of g.questions) {
      md += `- **${q.id}** (SRS ${q.srsSections.join(', ')}): ${q.text}\n`;
      if (q.reason) md += `  - Lý do hỏi bổ sung: ${q.reason}\n`;
      if (!visible.has(q.id)) {
        hidden++;
        const gate = q.showIf && byId.get(q.showIf.questionId);
        const why = gate ? `${gate.id} không chọn "${[q.showIf!.includes].flat().join('" / "')}"` : 'rẽ nhánh';
        md += `  - Trả lời: Không áp dụng (ẩn vì ${why})\n`;
        continue;
      }
      const a = st.answers[q.id];
      if (!a || a.status === 'skipped') skipped++;
      md += `  - Trả lời: ${formatAnswer(a, p.flow === 'standard')}\n`;
      const note = st.notes?.[q.id]?.trim();
      if (note) md += `  - Ghi chú BA (nội bộ): ${note.replace(/\s*\n\s*/g, ' / ')}\n`;
    }
    md += '\n';
  }
  md += `---\nSố câu chưa rõ / bỏ qua: ${skipped}\nSố câu không áp dụng (ẩn do rẽ nhánh): ${hidden}\n`;
  await fs.writeFile(path.join(projectDir(p.slug), `answers-${phase}.md`), md, 'utf8');
}

/** Đọc file JSON do AI ghi: questions-<phase>.json hoặc followup-<phase>.json. */
export async function readQuestionsFile(slug: string, phase: Phase, kind: 'questions' | 'followup' = 'questions'): Promise<unknown> {
  const name = `${kind}-${phase}.json`;
  const file = path.join(projectDir(slug), name);
  if (!existsSync(file)) throw new Error(`AI chưa tạo file ${name}`);
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

/**
 * Gắn câu hỏi bổ sung vào cuối bộ câu hỏi. Đổi id thành f1, f2… / fg1, fg2… để không trùng câu cũ.
 * Trả về vị trí (trong danh sách phẳng) của câu bổ sung đầu tiên.
 */
export function appendFollowup(set: QuestionSet, extra: QuestionSet): number {
  const firstIndex = set.groups.reduce((n, g) => n + g.questions.length, 0);
  const used = new Set(set.groups.flatMap((g) => [g.id, ...g.questions.map((q) => q.id)]));
  const nextId = (prefix: string) => {
    let i = 1;
    while (used.has(`${prefix}${i}`)) i++;
    used.add(`${prefix}${i}`);
    return `${prefix}${i}`;
  };
  for (const g of extra.groups) {
    set.groups.push({
      ...g,
      id: nextId('fg'),
      followup: true,
      questions: g.questions.map(({ showIf: _drop, ...q }) => ({ ...q, id: nextId('f') })),
    });
  }
  return firstIndex;
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
      // Bỏ bản chụp phiên bản và file rà soát (xem ở tab Rà soát / Phiên bản)
      if (e.isDirectory()) {
        if (!(dir === root && e.name === '_versions')) await walk(full);
      } else if (dir === root && e.name === '_review.md') continue;
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
