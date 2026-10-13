// API duyệt thư mục trên máy để chọn folder đích cho prototype.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HttpError } from './projects.js';

export interface DirListing {
  path: string | null; // null = danh sách ổ đĩa (Windows)
  parent: string | null;
  dirs: { name: string; path: string }[];
  fileCount: number;
}

function listDrives(): DirListing {
  const dirs = [];
  for (let c = 65; c <= 90; c++) {
    const d = `${String.fromCharCode(c)}:\\`;
    if (existsSync(d)) dirs.push({ name: d, path: d });
  }
  return { path: null, parent: null, dirs, fileCount: 0 };
}

export async function listDir(p?: string): Promise<DirListing> {
  if (!p) {
    if (process.platform === 'win32') return listDrives();
    p = os.homedir();
  }
  const full = path.resolve(p);
  let entries;
  try {
    entries = await fs.readdir(full, { withFileTypes: true });
  } catch {
    throw new HttpError(400, `Không mở được thư mục: ${full}`);
  }
  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('$'))
    .map((e) => ({ name: e.name, path: path.join(full, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const parentDir = path.dirname(full);
  const parent = parentDir === full ? (process.platform === 'win32' ? '' : null) : parentDir;
  // fileCount = tổng số mục trong folder (kể cả ẩn) — dùng để cảnh báo "folder đã có file"
  return { path: full, parent, dirs, fileCount: entries.length };
}

export async function makeDir(parent: string, name: string): Promise<string> {
  if (!name.trim() || /[<>:"/\\|?*]/.test(name)) throw new HttpError(400, 'Tên folder không hợp lệ');
  const full = path.join(path.resolve(parent), name.trim());
  if (existsSync(full)) throw new HttpError(409, 'Folder đã tồn tại');
  try {
    await fs.mkdir(full, { recursive: true });
  } catch {
    throw new HttpError(400, `Không tạo được folder: ${full}`);
  }
  return full;
}

/** Kiểm tra folder có ghi được không (ghi thử 1 file tạm rồi xóa đúng file đó). */
export async function checkWritable(dir: string): Promise<{ ok: boolean; entryCount: number; error?: string }> {
  const full = path.resolve(dir);
  try {
    const st = await fs.stat(full);
    if (!st.isDirectory()) return { ok: false, entryCount: 0, error: 'Đường dẫn không phải là folder' };
    const entries = await fs.readdir(full);
    const probe = path.join(full, `.ba-tool-write-test-${Date.now()}`);
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return { ok: true, entryCount: entries.length };
  } catch (e) {
    return { ok: false, entryCount: 0, error: `Folder không ghi được: ${e instanceof Error ? e.message : e}` };
  }
}
