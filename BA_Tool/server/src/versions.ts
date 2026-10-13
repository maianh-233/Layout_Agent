// Phiên bản SRS: chốt bản chụp vào srs/_versions/vX.Y/, so sánh hai phiên bản, xuất gói gửi khách.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createTwoFilesPatch } from 'diff';
import { REVIEW_AI, REVIEW_JSON, REVIEW_MD } from './review.js';

export const VERSIONS_DIR = '_versions';

/** File nội bộ: không chụp vào phiên bản (trừ registry...) và không gửi khách. */
const REVIEW_FILES = new Set([REVIEW_MD, REVIEW_JSON, REVIEW_AI]);

/** Liệt kê mọi file trong một thư mục SRS (bỏ _versions và file rà soát). Đường dẫn tương đối, dùng '/'. */
export async function listAll(root: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (rel !== VERSIONS_DIR) await walk(full);
      } else if (!REVIEW_FILES.has(rel)) out.push(rel);
    }
  };
  if (existsSync(root)) await walk(root);
  return out.sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
}

/** Gói gửi khách: chỉ file .md nội dung SRS; bỏ file nội bộ bắt đầu bằng "_" (trừ _integration.md) và mọi file JSON. */
export const isClientFile = (rel: string) => {
  if (!rel.endsWith('.md')) return false;
  const base = rel.split('/').pop()!;
  return !base.startsWith('_') || base === '_integration.md';
};

export async function listVersions(srs: string): Promise<string[]> {
  const dir = path.join(srs, VERSIONS_DIR);
  if (!existsSync(dir)) return [];
  const names = (await fs.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory() && /^v\d+\.\d+$/.test(e.name)).map((e) => e.name);
  return names.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

export function nextVersion(existing: string[]): string {
  if (!existing.length) return 'v0.1';
  const [maj, min] = existing[existing.length - 1].slice(1).split('.').map(Number);
  return `v${maj}.${min + 1}`;
}

/** Thư mục gốc của một phiên bản ("current" = srs/ hiện tại). Chặn tên lạ. */
export function versionRoot(srs: string, version: string): string {
  if (version === 'current') return srs;
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('Tên phiên bản không hợp lệ');
  const dir = path.join(srs, VERSIONS_DIR, version);
  if (!existsSync(dir)) throw new Error(`Không có phiên bản ${version}`);
  return dir;
}

// ---------- Mục 0.3 / 0.5 ----------

const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Ghi phiên bản vào 0.3 và thêm một dòng vào bảng 0.5 Revision History của 00-document-control.md. */
export function stampRevision(md: string, version: string, note: string, date = new Date()): string {
  const lines = md.split('\n');
  const headingAt = (num: string) => lines.findIndex((l) => new RegExp(`^##\\s*${num.replace('.', '\\.')}\\b`).test(l));
  const sectionEnd = (start: number) => {
    const next = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
    return next < 0 ? lines.length : next;
  };
  const row = `| ${version} | ${fmtDate(date)} | SRS Builder (AI) – BA review | ${note.replace(/\|/g, '/').replace(/\n/g, ' ') || 'Chốt phiên bản'} |`;

  // 0.5: chèn sau dòng cuối của bảng đầu tiên trong mục; chưa có bảng thì tạo
  const h5 = headingAt('0.5');
  if (h5 < 0) {
    lines.push('', '## 0.5. Revision History — Lịch sử chỉnh sửa', '', '| Phiên bản | Ngày | Người soạn | Nội dung |', '|---|---|---|---|', row);
  } else {
    const end = sectionEnd(h5);
    const tableStart = lines.findIndex((l, i) => i > h5 && i < end && l.trim().startsWith('|'));
    if (tableStart < 0) {
      lines.splice(h5 + 1, 0, '', '| Phiên bản | Ngày | Người soạn | Nội dung |', '|---|---|---|---|', row);
    } else {
      let last = tableStart;
      while (last + 1 < end && lines[last + 1].trim().startsWith('|')) last++;
      lines.splice(last + 1, 0, row);
    }
  }
  // 0.3: thay nội dung mục bằng phiên bản vừa chốt
  const h3 = headingAt('0.3');
  if (h3 >= 0) {
    const end = sectionEnd(h3);
    lines.splice(h3 + 1, end - h3 - 1, '', `${version} — chốt ngày ${fmtDate(date)}`, '');
  }
  return lines.join('\n');
}

// ---------- Chốt / so sánh ----------

/** Chụp srs/ hiện tại thành phiên bản mới (sau khi ghi 0.3/0.5). */
export async function lockVersion(srs: string, note: string): Promise<string> {
  const version = nextVersion(await listVersions(srs));
  const dc = path.join(srs, '00-document-control.md');
  if (existsSync(dc)) await fs.writeFile(dc, stampRevision(await fs.readFile(dc, 'utf8'), version, note), 'utf8');
  const dest = path.join(srs, VERSIONS_DIR, version);
  for (const rel of await listAll(srs)) {
    const to = path.join(dest, rel);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(path.join(srs, rel), to);
  }
  return version;
}

export interface FileDiff {
  path: string;
  status: 'added' | 'removed' | 'modified';
  patch: string;
  added: number;
  removed: number;
}

/** So sánh hai thư mục SRS theo từng file (diff dạng unified). */
export async function diffDirs(aRoot: string, bRoot: string, aLabel: string, bLabel: string): Promise<FileDiff[]> {
  const a = new Set(await listAll(aRoot));
  const b = new Set(await listAll(bRoot));
  const out: FileDiff[] = [];
  for (const rel of [...new Set([...a, ...b])].sort((x, y) => x.localeCompare(y, 'vi', { numeric: true }))) {
    const before = a.has(rel) ? await fs.readFile(path.join(aRoot, rel), 'utf8') : '';
    const after = b.has(rel) ? await fs.readFile(path.join(bRoot, rel), 'utf8') : '';
    if (before === after) continue;
    const patch = createTwoFilesPatch(`${aLabel}/${rel}`, `${bLabel}/${rel}`, before, after, '', '', { context: 3 });
    let added = 0;
    let removed = 0;
    for (const l of patch.split('\n').slice(2)) {
      if (l.startsWith('+') && !l.startsWith('+++')) added++;
      else if (l.startsWith('-') && !l.startsWith('---')) removed++;
    }
    out.push({ path: rel, status: !a.has(rel) ? 'added' : !b.has(rel) ? 'removed' : 'modified', patch, added, removed });
  }
  return out;
}
