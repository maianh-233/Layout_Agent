// Rà soát chất lượng SRS: kiểm bằng code (mã, truy vết, phân quyền, trạng thái, Mermaid)
// + gộp kết quả lượt AI (srs/_review-ai.json) → srs/_review.json và srs/_review.md.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { checkRegistry, traceIndex } from './registry.js';
import { checkDesignTokens } from './design.js';

export const SEVERITIES = ['critical', 'major', 'minor'] as const;
export type Severity = (typeof SEVERITIES)[number];
export const SEVERITY_LABELS: Record<Severity, string> = { critical: 'Nghiêm trọng', major: 'Cần sửa', minor: 'Gợi ý' };

export interface Finding {
  id: string;
  severity: Severity;
  source: 'code' | 'ai';
  category: string;
  message: string;
  /** Đường dẫn trong srs/ */
  file?: string;
  /** Số mục hoặc dòng, ví dụ "5.4" hoặc "dòng 120" */
  section?: string;
  codes?: string[];
  suggestion?: string;
  status: 'open' | 'fixed';
}

export interface Review {
  createdAt: string;
  ai: { status: 'done' | 'failed' | 'skipped'; error?: string };
  findings: Finding[];
}

export const REVIEW_JSON = '_review.json';
export const REVIEW_MD = '_review.md';
export const REVIEW_AI = '_review-ai.json';

/** Thư mục / file nội bộ không thuộc nội dung SRS khi quét. */
export const isInternalSrsPath = (rel: string) => rel.startsWith('_versions/') || rel === REVIEW_MD;

// ---------- Quét file ----------

async function listMd(srs: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(srs, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (rel !== '_versions') await walk(full);
      } else if (e.name.endsWith('.md') && !isInternalSrsPath(rel)) out.push(rel);
    }
  };
  if (existsSync(srs)) await walk(srs);
  return out.sort();
}

const CODE_RE = /\b(?:(?:BR|US|UC|FR|NFR|SCR|TC)-[A-Z0-9]{2,8}-\d{3}|ROLE-\d{2}|DOC-[A-Z0-9]{2,8}-[A-Z0-9_]{2,30}|ENT-[A-Z0-9_]{2,30})\b/g;
const MERMAID_RE = /```mermaid\s*\n([\s\S]*?)```/g;

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/** Gọi scripts/mermaid-check.mjs trong tiến trình riêng. */
async function checkMermaid(blocks: { id: string; code: string }[]): Promise<{ id: string; error: string }[] | null> {
  if (blocks.length === 0) return [];
  const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/mermaid-check.mjs');
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { cwd: path.dirname(script), stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.on('error', () => resolve(null));
    child.on('close', (code) => {
      try {
        resolve(code === 0 ? JSON.parse(out) : null);
      } catch {
        resolve(null);
      }
    });
    child.stdin.end(JSON.stringify(blocks));
  });
}

// ---------- Kiểm bằng code ----------

type Draft = Omit<Finding, 'id' | 'status' | 'source'>;

export async function codeReview(srs: string, phase: 'business' | 'ui'): Promise<Draft[]> {
  const out: Draft[] = [];
  const check = await checkRegistry(srs, phase);
  for (const e of check.errors) out.push({ severity: 'critical', category: 'Registry', message: e, file: '_registry.json' });
  if (phase === 'ui') for (const e of await checkDesignTokens(srs)) out.push({ severity: 'critical', category: 'Design tokens', message: e, file: '_design-tokens.json' });

  const files = await listMd(srs);
  const texts = new Map<string, string>();
  for (const f of files) texts.set(f, await fs.readFile(path.join(srs, f), 'utf8'));

  // Mermaid
  const blocks: { id: string; code: string }[] = [];
  const where = new Map<string, { file: string; line: number }>();
  for (const [f, text] of texts)
    for (const m of text.matchAll(MERMAID_RE)) {
      const id = `${f}#${m.index}`;
      blocks.push({ id, code: m[1] });
      where.set(id, { file: f, line: lineOf(text, m.index!) });
    }
  const merr = await checkMermaid(blocks);
  if (merr === null) out.push({ severity: 'minor', category: 'Mermaid', message: 'Chưa kiểm tra được cú pháp Mermaid (lỗi khi chạy trình kiểm tra).' });
  else
    for (const e of merr) {
      const w = where.get(e.id)!;
      out.push({ severity: 'major', category: 'Mermaid', message: `Sơ đồ Mermaid lỗi cú pháp: ${e.error}`, file: w.file, section: `dòng ${w.line}`, suggestion: 'Bọc nhãn có ký tự đặc biệt bằng "…", kiểm tra mũi tên và từ khóa của loại sơ đồ.' });
    }

  const R = check.registry;
  if (!R) return out;

  // Mã nhắc trong file ↔ registry (bỏ qua 12-traceability.md vì do code sinh)
  const known = new Set<string>([
    ...R.roles, ...R.businessRules, ...R.userStories, ...R.useCases, ...R.functional, ...R.nonFunctional, ...R.entities, ...R.documents, ...R.screens, ...R.testCases,
  ].map((x) => x.id));
  const mentioned = new Map<string, { file: string; line: number }>();
  const used = new Set<string>();
  for (const [f, text] of texts) {
    if (f === '12-traceability.md') continue;
    for (const m of text.matchAll(CODE_RE)) {
      used.add(m[0]);
      if (!known.has(m[0]) && !mentioned.has(m[0])) mentioned.set(m[0], { file: f, line: lineOf(text, m.index!) });
    }
  }
  for (const [id, w] of mentioned)
    out.push({ severity: 'major', category: 'Mã chưa đăng ký', message: `Mã ${id} được dùng trong SRS nhưng không có trong _registry.json`, file: w.file, section: `dòng ${w.line}`, codes: [id], suggestion: 'Thêm mã vào registry, hoặc sửa thành mã đúng.' });
  for (const id of known)
    if (!used.has(id))
      out.push({ severity: 'minor', category: 'Mã không dùng', message: `Mã ${id} có trong registry nhưng không còn được nhắc trong file SRS nào`, codes: [id], suggestion: 'Xóa khỏi registry nếu đã bỏ, hoặc bổ sung vào file đặc tả.' });

  // Truy vết
  const ix = traceIndex(R);
  for (const fr of R.functional) {
    if (fr.useCases.length === 0) out.push({ severity: 'major', category: 'Truy vết', message: `${fr.id} chưa gắn với Use Case nào`, file: fr.file.split('#')[0], codes: [fr.id] });
    if (!ix.frToTc.has(fr.id)) out.push({ severity: 'major', category: 'Truy vết', message: `${fr.id} chưa có test case`, file: fr.file.split('#')[0], codes: [fr.id] });
  }
  for (const s of R.screens)
    if (s.functional.length === 0) out.push({ severity: 'major', category: 'Truy vết', message: `Màn hình ${s.id} (${s.name}) chưa gắn với FR nào`, file: s.file.split('#')[0], codes: [s.id] });

  // Vai trò trong UC phải có quyền trong ma trận
  const P = check.permissions;
  if (P) {
    const missing = new Map<string, string[]>();
    for (const uc of R.useCases)
      for (const role of uc.actors) {
        const row = P.matrix[role];
        if (!row || Object.values(row).every((a) => a.length === 0)) missing.set(role, [...(missing.get(role) ?? []), uc.id]);
      }
    for (const [role, ucs] of missing)
      out.push({ severity: 'major', category: 'Phân quyền', message: `Vai trò ${role} là tác nhân của ${ucs.join(', ')} nhưng không có quyền nào trong ma trận phân quyền`, file: '04-user-requirements.md', section: '4.2', codes: [role, ...ucs] });
  }

  // Vòng đời chứng từ
  for (const d of R.documents) {
    const outgoing = new Set(d.transitions.map((t) => t.from));
    const incoming = new Set(d.transitions.map((t) => t.to));
    for (const s of d.states) {
      if (!s.final && !outgoing.has(s.id))
        out.push({ severity: 'major', category: 'Vòng đời chứng từ', message: `${d.id}: trạng thái "${s.name}" (${s.id}) không có đường ra và không được đánh dấu là trạng thái cuối`, file: d.file.split('#')[0], section: '5.6', codes: [d.id], suggestion: 'Thêm chuyển trạng thái đi ra, hoặc đặt final: true nếu đây là trạng thái kết thúc.' });
      if (!s.initial && !incoming.has(s.id))
        out.push({ severity: 'minor', category: 'Vòng đời chứng từ', message: `${d.id}: không có cách nào đi tới trạng thái "${s.name}" (${s.id})`, file: d.file.split('#')[0], section: '5.6', codes: [d.id] });
    }
  }
  return out;
}

// ---------- Kết quả lượt AI ----------

const AiFindingSchema = z.object({
  severity: z.enum(SEVERITIES),
  category: z.string().min(1),
  message: z.string().min(1),
  file: z.string().optional(),
  section: z.string().optional(),
  codes: z.array(z.string()).optional(),
  suggestion: z.string().optional(),
});
export const AiReviewSchema = z.object({ findings: z.array(AiFindingSchema).max(40) });

export async function readAiReview(srs: string): Promise<{ ok: true; findings: Draft[] } | { ok: false; error: string }> {
  const file = path.join(srs, REVIEW_AI);
  if (!existsSync(file)) return { ok: false, error: `AI chưa ghi ${REVIEW_AI}` };
  try {
    const raw = (await fs.readFile(file, 'utf8')).replace(/^﻿/, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const r = AiReviewSchema.safeParse(JSON.parse(raw));
    if (!r.success) return { ok: false, error: r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
    return { ok: true, findings: r.data.findings };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---------- Gộp + ghi ----------

const ORDER: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

export function buildReview(code: Draft[], ai: Draft[], aiState: Review['ai']): Review {
  const all = [
    ...code.map((f) => ({ ...f, source: 'code' as const })),
    ...ai.map((f) => ({ ...f, source: 'ai' as const })),
  ].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || (a.file ?? '').localeCompare(b.file ?? ''));
  return {
    createdAt: new Date().toISOString(),
    ai: aiState,
    findings: all.map((f, i) => ({
      ...f,
      id: `R-${String(i + 1).padStart(3, '0')}`,
      status: (f as { status?: Finding['status'] }).status ?? 'open',
    })),
  };
}

export function renderReviewMd(r: Review): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const open = r.findings.filter((f) => f.status === 'open');
  const L = [
    '# Rà soát chất lượng SRS (nội bộ)',
    '',
    `> File nội bộ cho BA — không gửi khách. Cập nhật: ${new Date(r.createdAt).toLocaleString('vi-VN')}.`,
    `> Lượt AI: ${r.ai.status === 'done' ? 'đã chạy' : r.ai.status === 'skipped' ? 'chưa chạy' : `lỗi (${r.ai.error ?? ''})`}.`,
    '',
    '| Mức | Còn mở |',
    '|---|---|',
    ...SEVERITIES.map((s) => `| ${SEVERITY_LABELS[s]} | ${open.filter((f) => f.severity === s).length} |`),
    '',
  ];
  for (const s of SEVERITIES) {
    const list = r.findings.filter((f) => f.severity === s);
    if (!list.length) continue;
    L.push(`## ${SEVERITY_LABELS[s]}`, '', '| Mã | Nguồn | Nhóm | Vấn đề | Vị trí | Gợi ý sửa | Trạng thái |', '|---|---|---|---|---|---|---|');
    for (const f of list) {
      const loc = f.file ? `[${f.file}](${f.file})${f.section ? ` · ${f.section}` : ''}` : '—';
      L.push(`| ${f.id} | ${f.source === 'code' ? 'Code' : 'AI'} | ${esc(f.category)} | ${esc(f.message)} | ${loc} | ${esc(f.suggestion ?? '—')} | ${f.status === 'fixed' ? 'Đã sửa' : 'Mở'} |`);
    }
    L.push('');
  }
  if (!r.findings.length) L.push('Không phát hiện vấn đề nào.', '');
  return L.join('\n');
}

export async function writeReview(srs: string, r: Review) {
  await fs.writeFile(path.join(srs, REVIEW_JSON), JSON.stringify(r, null, 2), 'utf8');
  await fs.writeFile(path.join(srs, REVIEW_MD), renderReviewMd(r), 'utf8');
}

export async function readReview(srs: string): Promise<Review | null> {
  const file = path.join(srs, REVIEW_JSON);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as Review;
  } catch {
    return null;
  }
}

export const reviewSummary = (r: Review) => {
  const open = r.findings.filter((f) => f.status === 'open');
  return {
    createdAt: r.createdAt,
    critical: open.filter((f) => f.severity === 'critical').length,
    major: open.filter((f) => f.severity === 'major').length,
    minor: open.filter((f) => f.severity === 'minor').length,
    aiStatus: r.ai.status,
  };
};
