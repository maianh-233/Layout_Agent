// Ảnh thật, đúng chủ đề cho prototype — AI không được tự vẽ / tự tạo / đoán link ảnh.
// Cấp cho AI hai công cụ (MCP chạy trong tool):
//   search_images(query) — tìm ảnh thật theo từ khóa, trả về tiêu đề / tag / mô tả để AI chọn đúng chủ đề
//   use_image(id, name)  — chỉ nhận id vừa tìm được; tải ảnh về <prototype>/assets/img/ và ghi nguồn vào CREDITS.md
//
// Nguồn theo chuỗi dự phòng: Pexels (PEXELS_API_KEY) → Unsplash (UNSPLASH_ACCESS_KEY) → Openverse (không cần key).
// Một nguồn lỗi xác thực (401/403) hoặc hết hạn mức (429) bị tạm bỏ qua và chuyển sang nguồn kế tiếp — trước đây
// khóa Pexels hỏng làm mọi lượt tìm trả 401 và website được dựng không có ảnh nào.
// Mọi bước ghi log có cấu trúc qua ImageLogger (jobs.ts ghi ra workspace/<slug>/logs/images.jsonl) — không ghi khóa API.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const IMG_DIR = 'assets/img';
export const IMAGE_TOOLS = ['mcp__images__search_images', 'mcp__images__use_image'];

export type Provider = 'pexels' | 'unsplash' | 'openverse';

export interface Found {
  id: string;
  provider: Provider;
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

/** Sự kiện log có cấu trúc (một dòng JSON). Không chứa khóa API. */
export type ImageEvent = Record<string, unknown> & { ev: string };
export type ImageLogger = (e: ImageEvent) => void;

/** Loại lỗi — để log và để AI / BA biết nên làm gì */
export type ImageErrorKind = 'auth' | 'quota' | 'timeout' | 'network' | 'bad_response' | 'http';

export class ImageError extends Error {
  constructor(
    message: string,
    public kind: ImageErrorKind,
    public provider?: Provider,
    public status?: number,
  ) {
    super(message);
  }
}

const KIND_HINT: Record<ImageErrorKind, string> = {
  auth: 'khóa API bị từ chối — kiểm tra PEXELS_API_KEY / UNSPLASH_ACCESS_KEY trong .env',
  quota: 'hết hạn mức gọi API — chờ rồi thử lại',
  timeout: 'quá thời gian chờ',
  network: 'lỗi mạng',
  bad_response: 'dữ liệu trả về sai cấu trúc',
  http: 'lỗi HTTP',
};

const UA = { 'User-Agent': 'ba-tool-prototype-builder/1.0' };
const REQUEST_TIMEOUT = 15000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classify(e: unknown, provider: Provider): ImageError {
  if (e instanceof ImageError) return e;
  const err = e as Error;
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return new ImageError(`${provider}: quá ${REQUEST_TIMEOUT / 1000}s không phản hồi`, 'timeout', provider);
  return new ImageError(`${provider}: ${err?.message ?? String(e)}`, 'network', provider);
}

/**
 * GET JSON có giới hạn thử lại: 429 / 5xx thử lại 2 lần (chờ 3s, 6s); timeout / lỗi mạng thử lại 1 lần.
 * 401 / 403 không thử lại (khóa sai thì thử lại cũng vô ích).
 */
async function getJson(url: string, provider: Provider, headers: Record<string, string> = {}, onRetry?: (why: string) => void): Promise<any> {
  let netRetries = 0;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { ...UA, ...headers }, signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
    } catch (e) {
      const err = classify(e, provider);
      if (netRetries++ < 1) {
        onRetry?.(err.kind);
        await sleep(1500);
        continue;
      }
      throw err;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      onRetry?.(`http ${res.status}`);
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new ImageError(`${provider} trả về ${res.status}`, 'auth', provider, res.status);
    if (res.status === 429) throw new ImageError(`${provider} trả về 429 (hết hạn mức)`, 'quota', provider, 429);
    if (!res.ok) throw new ImageError(`${provider} trả về ${res.status}`, 'http', provider, res.status);
    try {
      return await res.json();
    } catch {
      throw new ImageError(`${provider}: phản hồi không phải JSON`, 'bad_response', provider);
    }
  }
}

/** Kiểm tra cấu trúc phản hồi: phải có mảng kết quả, không thì coi là lỗi (không coi là "0 ảnh"). */
function rowsOf(data: any, key: string, provider: Provider): any[] {
  const rows = data?.[key];
  if (!Array.isArray(rows)) throw new ImageError(`${provider}: phản hồi thiếu mảng "${key}"`, 'bad_response', provider);
  return rows;
}

type Searcher = (q: string, n: number, o: Orientation | undefined, onRetry: (why: string) => void) => Promise<Found[]>;

const searchPexels: Searcher = async (q, n, o, onRetry) => {
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', q);
  u.searchParams.set('per_page', String(n));
  if (o) u.searchParams.set('orientation', o);
  const data = await getJson(u.href, 'pexels', { Authorization: process.env.PEXELS_API_KEY!.trim() }, onRetry);
  return rowsOf(data, 'photos', 'pexels').map((p: any) => ({
    id: `pexels-${p.id}`,
    provider: 'pexels' as const,
    title: p.alt || '',
    tags: [],
    width: p.width,
    height: p.height,
    urls: [p.src?.large2x, p.src?.large, p.src?.original].filter(Boolean),
    creator: p.photographer ?? '',
    license: 'Pexels License',
    page: p.url ?? '',
  }));
};

const searchUnsplash: Searcher = async (q, n, o, onRetry) => {
  const u = new URL('https://api.unsplash.com/search/photos');
  u.searchParams.set('query', q);
  u.searchParams.set('per_page', String(n));
  u.searchParams.set('content_filter', 'high');
  if (o) u.searchParams.set('orientation', o === 'square' ? 'squarish' : o);
  const data = await getJson(u.href, 'unsplash', { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY!.trim()}`, 'Accept-Version': 'v1' }, onRetry);
  return rowsOf(data, 'results', 'unsplash').map((p: any) => ({
    id: `unsplash-${p.id}`,
    provider: 'unsplash' as const,
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
};

/** Flickr: link .../ID_SECRET.jpg là bản 500px; _b là 1024px, _h là 1600px (nếu có). */
const flickrSizes = (url: string) => {
  const m = /^(https:\/\/live\.staticflickr\.com\/\d+\/\d+_[0-9a-f]+)(?:_[a-z])?\.jpg$/.exec(url);
  return m ? [`${m[1]}_b.jpg`, url] : [url];
};

const searchOpenverse: Searcher = async (q, n, o, onRetry) => {
  const run = async (query: string, large: boolean) => {
    const u = new URL('https://api.openverse.org/v1/images/');
    u.searchParams.set('q', query);
    u.searchParams.set('page_size', String(Math.min(n, 20)));
    u.searchParams.set('mature', 'false');
    u.searchParams.set('category', 'photograph');
    if (large) u.searchParams.set('size', 'large');
    if (o) u.searchParams.set('aspect_ratio', o === 'landscape' ? 'wide' : o === 'portrait' ? 'tall' : 'square');
    return rowsOf(await getJson(u.href, 'openverse', {}, onRetry), 'results', 'openverse');
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
    .filter((p) => p?.url && p?.id && !seen.has(p.id) && seen.add(p.id))
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
};

const SEARCHERS: Record<Provider, Searcher> = { pexels: searchPexels, unsplash: searchUnsplash, openverse: searchOpenverse };

/** Chuỗi nguồn theo khóa có trong môi trường; Openverse (không cần khóa) luôn đứng cuối làm dự phòng. */
export function providerChain(): Provider[] {
  const chain: Provider[] = [];
  if (process.env.PEXELS_API_KEY?.trim()) chain.push('pexels');
  if (process.env.UNSPLASH_ACCESS_KEY?.trim()) chain.push('unsplash');
  chain.push('openverse');
  return chain;
}

/** Nguồn đứng đầu chuỗi (để hiển thị) */
export const imageProvider = (): Provider => providerChain()[0];

/**
 * Nguồn đang tạm bỏ qua vì lỗi (dùng chung trong tiến trình server): khóa sai → 30 phút, hết hạn mức → 10 phút.
 * Gắn với dấu vân tay của khóa: đổi khóa trong .env (và khởi động lại) thì thử lại ngay.
 */
const benched = new Map<Provider, { until: number; kind: ImageErrorKind; message: string; key: string }>();
const keyPrint = (p: Provider) => {
  const k = p === 'pexels' ? process.env.PEXELS_API_KEY : p === 'unsplash' ? process.env.UNSPLASH_ACCESS_KEY : '';
  return k ? `${k.trim().length}:${k.trim().slice(-4)}` : '';
};
function isBenched(p: Provider) {
  const b = benched.get(p);
  if (!b) return null;
  if (Date.now() > b.until || b.key !== keyPrint(p)) {
    benched.delete(p);
    return null;
  }
  return b;
}
function bench(p: Provider, e: ImageError) {
  const ms = e.kind === 'auth' ? 30 * 60_000 : e.kind === 'quota' ? 10 * 60_000 : 0;
  if (ms) benched.set(p, { until: Date.now() + ms, kind: e.kind, message: e.message, key: keyPrint(p) });
}

export interface SearchAttempt {
  provider: Provider;
  ms: number;
  count?: number;
  error?: string;
  kind?: ImageErrorKind;
  skipped?: boolean;
  retries?: string[];
}

/**
 * Tìm ảnh theo chuỗi dự phòng. Nguồn lỗi auth / quota / mạng / sai cấu trúc → thử nguồn kế tiếp.
 * Một nguồn trả 0 kết quả (không lỗi) vẫn là thành công — không đổi nguồn (để AI đổi từ khóa).
 * Tất cả nguồn lỗi → ném ImageError (kind của lỗi cuối).
 */
export async function searchWithFallback(q: string, n = 12, o?: Orientation): Promise<{ rows: Found[]; provider: Provider; attempts: SearchAttempt[] }> {
  const attempts: SearchAttempt[] = [];
  let last: ImageError | undefined;
  for (const provider of providerChain()) {
    const b = isBenched(provider);
    if (b) {
      attempts.push({ provider, ms: 0, skipped: true, kind: b.kind, error: b.message });
      last = new ImageError(b.message, b.kind, provider);
      continue;
    }
    const t = Date.now();
    const retries: string[] = [];
    try {
      const rows = (await SEARCHERS[provider](q, n, o, (why) => retries.push(why))).filter((r) => r.id && r.urls.length);
      attempts.push({ provider, ms: Date.now() - t, count: rows.length, ...(retries.length ? { retries } : {}) });
      return { rows, provider, attempts };
    } catch (e) {
      const err = classify(e, provider);
      bench(provider, err);
      attempts.push({ provider, ms: Date.now() - t, error: err.message, kind: err.kind, ...(retries.length ? { retries } : {}) });
      last = err;
    }
  }
  throw last ?? new ImageError('Không có nguồn ảnh nào', 'network');
}

/** Giữ API cũ: chỉ trả danh sách ảnh */
export async function searchImages(q: string, n = 12, o?: Orientation): Promise<Found[]> {
  return (await searchWithFallback(q, n, o)).rows;
}

/**
 * Kiểm tra trước khi giao việc cho AI (không tốn lượt AI): tìm thử một từ khóa và tải thử một ảnh.
 * Kết quả ghi vào concept.md để AI biết công cụ ảnh có dùng được không.
 */
export async function probeImages(log?: ImageLogger): Promise<{ ok: boolean; provider?: Provider; attempts: SearchAttempt[]; error?: string; kind?: ImageErrorKind }> {
  const t = Date.now();
  try {
    const { rows, provider, attempts } = await searchWithFallback('mountain landscape', 6, 'landscape');
    if (!rows.length) {
      const r = { ok: false, provider, attempts, error: `${provider} trả 0 kết quả cho từ khóa kiểm tra`, kind: 'bad_response' as const };
      log?.({ ev: 'preflight', ok: false, ms: Date.now() - t, provider, attempts, error: r.error });
      return r;
    }
    log?.({ ev: 'preflight', ok: true, ms: Date.now() - t, provider, attempts });
    return { ok: true, provider, attempts };
  } catch (e) {
    const err = e as ImageError;
    log?.({ ev: 'preflight', ok: false, ms: Date.now() - t, error: err.message, kind: err.kind });
    return { ok: false, attempts: [], error: err.message, kind: err.kind };
  }
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

/** Tải ảnh: thử lần lượt các link; mỗi link thử lại 1 lần khi timeout / lỗi mạng. Kiểm tra kiểu file và kích thước. */
export async function download(found: Found, target: string, name: string): Promise<{ rel: string; bytes: number; url: string }> {
  const errors: string[] = [];
  for (const url of found.urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(30000) });
        const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
        if (!res.ok || !EXT[type]) {
          errors.push(`${new URL(url).host}: ${res.status} ${type || '(không có content-type)'}`);
          break;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 8000) {
          errors.push(`${new URL(url).host}: ảnh quá nhỏ / ảnh giữ chỗ (${buf.length} byte)`);
          break;
        }
        const rel = `${IMG_DIR}/${slug(name)}.${EXT[type]}`;
        await fs.mkdir(path.join(target, IMG_DIR), { recursive: true });
        await fs.writeFile(path.join(target, rel), buf);
        return { rel, bytes: buf.length, url };
      } catch (e) {
        const err = classify(e, found.provider);
        errors.push(`${new URL(url).host}: ${err.kind}`);
        if (attempt === 0 && (err.kind === 'timeout' || err.kind === 'network')) {
          await sleep(1000);
          continue;
        }
        break;
      }
    }
  }
  throw new Error(`Không tải được ảnh ${found.id} (${errors.join('; ')}). Hãy chọn ảnh khác trong kết quả tìm kiếm.`);
}

export interface Credit {
  file: string;
  purpose?: string;
  source: Provider;
  id: string;
  title?: string;
  creator?: string;
  license?: string;
  page?: string;
}

export async function readCredits(target: string): Promise<Credit[]> {
  const file = path.join(target, IMG_DIR, '_credits.json');
  if (!existsSync(file)) return [];
  try {
    const list = JSON.parse(await fs.readFile(file, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function writeCredits(target: string, rel: string, f: Found, purpose: string) {
  const list = await readCredits(target);
  const row: Credit = { file: rel, purpose, source: f.provider, id: f.id, title: f.title, creator: f.creator, license: f.license, page: f.page };
  const next = [...list.filter((x) => x.file !== rel), row];
  await fs.writeFile(path.join(target, IMG_DIR, '_credits.json'), JSON.stringify(next, null, 2), 'utf8');
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
const fail = (t: string) => ({ content: [{ type: 'text' as const, text: t }], isError: true });

/** Giới hạn mỗi lượt AI — không để vòng tìm / tải lặp vô hạn */
const MAX_SEARCHES = 60;
const MAX_USES = 60;

/** MCP server cho một lượt AI: kết quả tìm kiếm được nhớ để use_image chỉ nhận id có thật. */
export function imageServer(target: string, log: (t: string) => void, record: ImageLogger = () => {}) {
  const found = new Map<string, Found>();
  /** id ảnh → file đã tải (kể cả từ các lượt trước, đọc từ _credits.json) — tránh tải trùng một ảnh cho nhiều vị trí */
  let usedById: Map<string, string> | null = null;
  const used = async () => (usedById ??= new Map((await readCredits(target)).map((c) => [c.id, c.file])));
  let searches = 0;
  let uses = 0;

  return createSdkMcpServer({
    name: 'images',
    version: '1.1.0',
    alwaysLoad: true,
    instructions:
      'Ảnh trong prototype chỉ được lấy qua search_images + use_image. Không dùng link ảnh tự nghĩ ra, picsum, placeholder, ảnh do AI tạo hay hình vẽ SVG thay cho ảnh chụp.',
    tools: [
      tool(
        'search_images',
        'Tìm ảnh chụp thật theo từ khóa tiếng Anh, 2–4 từ, chủ thể chính đứng đầu (ví dụ "birthday cake strawberry", "dentist patient clinic"). ' +
          'Trả về danh sách ảnh kèm tiêu đề, tag, kích thước để chọn ảnh ĐÚNG chủ đề. Không có ảnh nào khớp thì tìm lại bằng từ khóa khác (tối đa 3 lần cho một vị trí).',
        {
          query: z.string().min(2).describe('Từ khóa tìm ảnh, tiếng Anh'),
          orientation: z.enum(['landscape', 'portrait', 'square']).optional().describe('Hướng ảnh cần cho vị trí đặt'),
          count: z.number().int().min(4).max(20).optional(),
        },
        async ({ query, orientation, count }) => {
          if (++searches > MAX_SEARCHES) {
            record({ ev: 'search', query, error: 'vượt giới hạn lượt tìm', kind: 'quota', capped: true });
            return fail(`Đã dùng hết ${MAX_SEARCHES} lượt tìm của lượt này. Dùng các ảnh đã tải; vị trí còn thiếu → bố cục không ảnh và ghi vào sitemap.json (status "none").`);
          }
          const t = Date.now();
          try {
            const { rows, provider, attempts } = await searchWithFallback(query, count ?? 12, orientation);
            rows.forEach((r) => found.set(r.id, r));
            const fellBack = attempts.filter((a) => a.error);
            record({ ev: 'search', query, orientation, provider, ms: Date.now() - t, count: rows.length, attempts });
            log(`Tìm ảnh "${query}": ${rows.length} kết quả (${provider}${fellBack.length ? `, bỏ qua ${fellBack.map((a) => `${a.provider}: ${a.kind}`).join(', ')}` : ''})`);
            if (!rows.length) return text(`Không có ảnh cho "${query}" (nguồn ${provider}). Thử từ khóa khác: rộng hơn, đồng nghĩa, bỏ tính từ.`);
            const already = await used();
            return text(
              rows
                .map(
                  (r) =>
                    `- id: ${r.id} | ${r.width}×${r.height} | ${r.title || '(không tiêu đề)'}${r.tags.length ? ` | tag: ${r.tags.join(', ')}` : ''}${already.has(r.id) ? ` | ĐÃ DÙNG: ${already.get(r.id)}` : ''}`,
                )
                .join('\n'),
            );
          } catch (e) {
            const err = e as ImageError;
            record({ ev: 'search', query, orientation, ms: Date.now() - t, error: err.message, kind: err.kind });
            log(`Lỗi tìm ảnh "${query}": ${err.message}`);
            return fail(
              `Lỗi tìm ảnh (${KIND_HINT[err.kind] ?? err.kind}): ${err.message}. Mọi nguồn ảnh đều lỗi. ` +
                'Không thử lại liên tục: nếu lần tìm tiếp theo vẫn lỗi thì dừng tìm, dựng các vị trí còn thiếu bằng bố cục không ảnh và ghi status "none" trong sitemap.json.',
            );
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
          purpose: z.string().optional().describe('Dùng cho đâu, ví dụ "about.html — ảnh xưởng may"'),
        },
        async ({ id, name, purpose }) => {
          if (++uses > MAX_USES) {
            record({ ev: 'use', id, name, error: 'vượt giới hạn lượt tải', capped: true });
            return fail(`Đã tải tối đa ${MAX_USES} ảnh trong lượt này.`);
          }
          const f = found.get(id);
          if (!f) {
            record({ ev: 'use', id, name, error: 'id không có trong kết quả tìm kiếm của lượt này' });
            return fail(`Không có ảnh id "${id}" trong kết quả tìm kiếm của lượt này. Gọi search_images trước và dùng đúng id.`);
          }
          const already = (await used()).get(id);
          if (already && existsSync(path.join(target, already))) {
            record({ ev: 'use', id, name, provider: f.provider, file: already, reused: true });
            return text(
              `Ảnh này đã được tải trước đó: ${already}. Không tải bản sao. Nếu thật sự hợp vị trí mới thì dùng lại đường dẫn đó; tốt hơn là chọn ảnh khác để không lặp ảnh.`,
            );
          }
          const t = Date.now();
          try {
            const { rel, bytes, url } = await download(f, target, name);
            await writeCredits(target, rel, f, purpose ?? '');
            (await used()).set(id, rel);
            if (f.trackUrl) fetch(`${f.trackUrl}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`).catch(() => {});
            record({ ev: 'use', id, name, purpose, provider: f.provider, file: rel, bytes, ms: Date.now() - t, host: new URL(url).host, size: `${f.width}x${f.height}` });
            log(`Đã tải ảnh ${rel} (${Math.round(bytes / 1024)} KB)`);
            return text(`Đã lưu ${rel} (${f.width}×${f.height}). Dùng trong HTML bằng đường dẫn tương đối tới file này. File đầy đủ: ${path.join(target, rel)}`);
          } catch (e) {
            record({ ev: 'use', id, name, provider: f.provider, ms: Date.now() - t, error: (e as Error).message });
            log(`Không tải được ảnh ${id}`);
            return fail((e as Error).message);
          }
        },
      ),
    ],
  });
}
