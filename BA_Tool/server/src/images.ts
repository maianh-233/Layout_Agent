// Ảnh thật, đúng chủ đề cho prototype — AI không được tự vẽ / tự tạo / đoán link ảnh.
// Cấp cho AI hai công cụ (MCP chạy trong tool):
//   search_images(query) — tìm ảnh thật theo từ khóa, trả về tiêu đề / tag / mô tả để AI chọn đúng chủ đề
//   use_image(id, name)  — chỉ nhận id vừa tìm được; tải ảnh về <prototype>/assets/img/ và ghi nguồn vào CREDITS.md
// Nguồn: Pexels (PEXELS_API_KEY) → Unsplash (UNSPLASH_ACCESS_KEY) → Openverse (không cần key, ảnh giấy phép CC).
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const IMG_DIR = 'assets/img';
export const IMAGE_TOOLS = ['mcp__images__search_images', 'mcp__images__use_image'];

interface Found {
  id: string;
  provider: 'pexels' | 'unsplash' | 'openverse';
  title: string;
  tags: string[];
  width: number;
  height: number;
  /** Link tải bản lớn (thử lần lượt) */
  urls: string[];
  creator: string;
  license: string;
  page: string;
  /** Unsplash yêu cầu báo lượt tải */
  trackUrl?: string;
}

type Orientation = 'landscape' | 'portrait' | 'square';

const UA = { 'User-Agent': 'ba-tool-prototype-builder/1.0' };

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(20000) });
    // Bị giới hạn tốc độ (Openverse không key) → chờ rồi thử lại
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`${new URL(url).host} trả về ${res.status}${res.status === 429 ? ' (quá nhiều lượt tìm, chờ một chút)' : ''}`);
    return res.json();
  }
}

async function searchPexels(q: string, n: number, o?: Orientation): Promise<Found[]> {
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', q);
  u.searchParams.set('per_page', String(n));
  if (o) u.searchParams.set('orientation', o);
  const data = await getJson(u.href, { Authorization: process.env.PEXELS_API_KEY! });
  return (data.photos ?? []).map((p: any) => ({
    id: `pexels-${p.id}`,
    provider: 'pexels',
    title: p.alt || '',
    tags: [],
    width: p.width,
    height: p.height,
    urls: [p.src?.large2x, p.src?.large, p.src?.original].filter(Boolean),
    creator: p.photographer,
    license: 'Pexels License',
    page: p.url,
  }));
}

async function searchUnsplash(q: string, n: number, o?: Orientation): Promise<Found[]> {
  const u = new URL('https://api.unsplash.com/search/photos');
  u.searchParams.set('query', q);
  u.searchParams.set('per_page', String(n));
  u.searchParams.set('content_filter', 'high');
  if (o) u.searchParams.set('orientation', o === 'square' ? 'squarish' : o);
  const data = await getJson(u.href, { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' });
  return (data.results ?? []).map((p: any) => ({
    id: `unsplash-${p.id}`,
    provider: 'unsplash',
    title: [p.description, p.alt_description].filter(Boolean).join(' — '),
    tags: (p.tags ?? []).map((t: any) => t.title).filter(Boolean),
    width: p.width,
    height: p.height,
    urls: [p.urls?.raw ? `${p.urls.raw}&w=1920&q=80&fm=jpg&fit=max` : '', p.urls?.regular].filter(Boolean),
    creator: p.user?.name ?? '',
    license: 'Unsplash License',
    page: p.links?.html ?? '',
    trackUrl: p.links?.download_location,
  }));
}

/** Flickr: link .../ID_SECRET.jpg là bản 500px; _b là 1024px, _h là 1600px (nếu có). */
const flickrSizes = (url: string) => {
  const m = /^(https:\/\/live\.staticflickr\.com\/\d+\/\d+_[0-9a-f]+)(?:_[a-z])?\.jpg$/.exec(url);
  return m ? [`${m[1]}_b.jpg`, url] : [url];
};

async function searchOpenverse(q: string, n: number, o?: Orientation): Promise<Found[]> {
  const run = async (query: string, large: boolean) => {
    const u = new URL('https://api.openverse.org/v1/images/');
    u.searchParams.set('q', query);
    u.searchParams.set('page_size', String(Math.min(n, 20)));
    u.searchParams.set('mature', 'false');
    u.searchParams.set('category', 'photograph');
    if (large) u.searchParams.set('size', 'large');
    if (o) u.searchParams.set('aspect_ratio', o === 'landscape' ? 'wide' : o === 'portrait' ? 'tall' : 'square');
    const data = await getJson(u.href);
    return (data.results ?? []) as any[];
  };
  // Openverse ghép các từ theo kiểu "và" → từ khóa dài ít kết quả: bớt dần từ cuối (giữ tối thiểu 2 từ)
  const words = q.trim().split(/\s+/);
  let rows: any[] = [];
  for (let k = words.length; k >= Math.min(2, words.length) && rows.length < 6; k--) {
    const sub = words.slice(0, k).join(' ');
    rows = [...rows, ...(await run(sub, true))];
    if (rows.length < 4) rows = [...rows, ...(await run(sub, false))];
  }
  const seen = new Set<string>();
  return rows
    .filter((p) => p.url && !seen.has(p.id) && seen.add(p.id))
    .map((p) => ({
      id: `openverse-${p.id}`,
      provider: 'openverse' as const,
      title: p.title || '',
      tags: (p.tags ?? []).map((t: any) => t.name).filter(Boolean).slice(0, 12),
      width: p.width ?? 0,
      height: p.height ?? 0,
      urls: p.source === 'flickr' ? flickrSizes(p.url) : [p.url],
      creator: p.creator || '',
      license: `CC ${String(p.license || '').toUpperCase()} ${p.license_version || ''}`.trim(),
      page: p.foreign_landing_url || '',
    }));
}

export function imageProvider(): 'pexels' | 'unsplash' | 'openverse' {
  if (process.env.PEXELS_API_KEY?.trim()) return 'pexels';
  if (process.env.UNSPLASH_ACCESS_KEY?.trim()) return 'unsplash';
  return 'openverse';
}

export async function searchImages(q: string, n = 12, o?: Orientation): Promise<Found[]> {
  const p = imageProvider();
  if (p === 'pexels') return searchPexels(q, n, o);
  if (p === 'unsplash') return searchUnsplash(q, n, o);
  return searchOpenverse(q, n, o);
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'anh';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export async function download(found: Found, target: string, name: string): Promise<{ rel: string; bytes: number }> {
  let lastError = '';
  for (const url of found.urls) {
    try {
      const res = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
      if (!res.ok || !EXT[type]) {
        lastError = `${res.status} ${type}`;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 8000) {
        lastError = 'ảnh quá nhỏ / ảnh giữ chỗ';
        continue;
      }
      const rel = `${IMG_DIR}/${slug(name)}.${EXT[type]}`;
      await fs.mkdir(path.join(target, IMG_DIR), { recursive: true });
      await fs.writeFile(path.join(target, rel), buf);
      return { rel, bytes: buf.length };
    } catch (e) {
      lastError = (e as Error).message;
    }
  }
  throw new Error(`Không tải được ảnh ${found.id} (${lastError}). Hãy chọn ảnh khác trong kết quả tìm kiếm.`);
}

export async function writeCredits(target: string, rel: string, f: Found, purpose: string) {
  const file = path.join(target, IMG_DIR, '_credits.json');
  const list: Record<string, unknown>[] = existsSync(file) ? JSON.parse(await fs.readFile(file, 'utf8')) : [];
  const row = { file: rel, purpose, source: f.provider, id: f.id, title: f.title, creator: f.creator, license: f.license, page: f.page };
  const next = [...list.filter((x) => x.file !== rel), row];
  await fs.writeFile(file, JSON.stringify(next, null, 2), 'utf8');
  const md = [
    '# Nguồn ảnh',
    '',
    '> Tool tải về từ thư viện ảnh thật (không phải ảnh do AI tạo). Khi đưa lên web thật, giữ ghi công theo giấy phép hoặc thay bằng ảnh của khách.',
    '',
    '| File | Dùng cho | Nguồn | Tác giả | Giấy phép | Link gốc |',
    '|---|---|---|---|---|---|',
    ...next.map((x) => `| ${x.file} | ${String(x.purpose ?? '').replace(/\|/g, '/')} | ${x.source} | ${String(x.creator ?? '').replace(/\|/g, '/')} | ${x.license} | ${x.page} |`),
    '',
  ];
  await fs.writeFile(path.join(target, IMG_DIR, 'CREDITS.md'), md.join('\n'), 'utf8');
}

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });

/** MCP server cho một lượt AI: kết quả tìm kiếm được nhớ để use_image chỉ nhận id có thật. */
export function imageServer(target: string, log: (t: string) => void) {
  const found = new Map<string, Found>();
  return createSdkMcpServer({
    name: 'images',
    version: '1.0.0',
    alwaysLoad: true,
    instructions:
      'Ảnh trong prototype chỉ được lấy qua search_images + use_image. Không dùng link ảnh tự nghĩ ra, picsum, placeholder, ảnh do AI tạo hay hình vẽ SVG thay cho ảnh chụp.',
    tools: [
      tool(
        'search_images',
        'Tìm ảnh chụp thật theo từ khóa tiếng Anh, 2–4 từ, chủ thể chính đứng đầu (ví dụ "birthday cake strawberry", "dentist patient clinic"). ' +
          'Trả về danh sách ảnh kèm tiêu đề, tag, kích thước để chọn ảnh ĐÚNG chủ đề. Không có ảnh nào khớp thì tìm lại bằng từ khóa khác.',
        {
          query: z.string().min(2).describe('Từ khóa tìm ảnh, tiếng Anh'),
          orientation: z.enum(['landscape', 'portrait', 'square']).optional().describe('Hướng ảnh cần cho vị trí đặt'),
          count: z.number().int().min(4).max(20).optional(),
        },
        async ({ query, orientation, count }) => {
          try {
            const rows = await searchImages(query, count ?? 12, orientation);
            rows.forEach((r) => found.set(r.id, r));
            log(`Tìm ảnh "${query}": ${rows.length} kết quả (${imageProvider()})`);
            if (!rows.length) return text(`Không có ảnh cho "${query}". Thử từ khóa khác (rộng hơn, tiếng Anh).`);
            return text(
              rows
                .map((r) => `- id: ${r.id} | ${r.width}×${r.height} | ${r.title || '(không tiêu đề)'}${r.tags.length ? ` | tag: ${r.tags.join(', ')}` : ''}`)
                .join('\n'),
            );
          } catch (e) {
            return text(`Lỗi tìm ảnh: ${(e as Error).message}. Thử lại một lần; vẫn lỗi thì không dùng ảnh ở vị trí đó (xem hướng dẫn image-guide).`);
          }
        },
      ),
      tool(
        'use_image',
        'Tải một ảnh (id lấy từ search_images) về assets/img/<name> trong prototype và ghi nguồn. Trả về đường dẫn tương đối để dùng trong <img src>. ' +
          'Sau đó dùng Read mở file ảnh để kiểm tra đúng chủ đề; sai thì chọn ảnh khác.',
        {
          id: z.string().describe('id ảnh từ kết quả search_images'),
          name: z.string().min(2).describe('Tên file gợi nhớ vị trí, ví dụ "hero-banh-kem"'),
          purpose: z.string().optional().describe('Dùng cho đâu, ví dụ "Ảnh hero"'),
        },
        async ({ id, name, purpose }) => {
          const f = found.get(id);
          if (!f) return text(`Không có ảnh id "${id}" trong kết quả tìm kiếm của lượt này. Gọi search_images trước và dùng đúng id.`);
          try {
            const { rel, bytes } = await download(f, target, name);
            await writeCredits(target, rel, f, purpose ?? '');
            if (f.trackUrl) fetch(`${f.trackUrl}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`).catch(() => {});
            log(`Đã tải ảnh ${rel} (${Math.round(bytes / 1024)} KB)`);
            return text(`Đã lưu ${rel} (${f.width}×${f.height}). Dùng trong HTML bằng đường dẫn tương đối tới file này. File đầy đủ: ${path.join(target, rel)}`);
          } catch (e) {
            return text((e as Error).message);
          }
        },
      ),
    ],
  });
}
