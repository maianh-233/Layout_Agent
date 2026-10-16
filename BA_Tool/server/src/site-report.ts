// Chế độ nhanh (website nhiều trang): kiểm tra bằng code sau khi AI dựng + README của website.
//   auditSite()      — sitemap ↔ trang thật, ngôn ngữ, tên thương hiệu, menu, link giả, mức chuyển động,
//                      màu / font BA yêu cầu, ảnh (tải về ↔ dùng trong trang). Lỗi gộp vào báo cáo QA.
//   diagnoseImages() — xếp chuỗi ảnh vào đúng một trong 7 trường hợp (tool không được gọi … ảnh không tải được).
//   writeSiteReadme()— README.md trong folder website, chỉ ghi điều kiểm chứng được (config, sitemap AI ghi,
//                      file thật, log ảnh, kết quả QA). README của tool (BA_Tool/README.md) là tài liệu khác.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { z } from 'zod';
import { familyName, type FontCheck } from './fonts.js';
import { readCredits, IMG_DIR, type Credit } from './images.js';
import { ConceptSchema, PRESETS, languageOf, resolvePreset, sectionOf, type Concept } from './presets.js';
import type { QaIssue, QaReport } from './qa.js';

type Issue = Omit<QaIssue, 'id'>;

export const BUILD_DIR = '_build';
export const SITEMAP_FILE = `${BUILD_DIR}/sitemap.json`;

// ---------- sitemap.json do AI ghi (đọc dễ dãi: thiếu trường thì bỏ qua) ----------

const SitemapSchema = z
  .object({
    brand: z.string().optional(),
    language: z.string().optional(),
    preset: z.string().optional(),
    motionLevel: z.union([z.number(), z.string()]).optional(),
    visualIdea: z.string().optional(),
    purposeInferred: z.string().optional(),
    pages: z.array(
      z
        .object({
          file: z.string(),
          title: z.string().optional(),
          purpose: z.string().optional(),
          sections: z
            .array(z.object({ id: z.string(), catalog: z.string().optional(), variant: z.string().optional(), source: z.string().optional(), note: z.string().optional() }).passthrough())
            .optional(),
          images: z
            .array(z.object({ slot: z.string(), query: z.string().optional(), file: z.string().nullable().optional(), status: z.string().optional() }).passthrough())
            .optional(),
        })
        .passthrough(),
    ),
    adjustments: z.array(z.string()).optional(),
    limitations: z.array(z.string()).optional(),
  })
  .passthrough();
export type Sitemap = z.infer<typeof SitemapSchema>;

export async function readSitemap(target: string): Promise<{ sitemap: Sitemap | null; error?: string }> {
  const file = path.join(target, SITEMAP_FILE);
  if (!existsSync(file)) return { sitemap: null, error: `AI chưa ghi ${SITEMAP_FILE}` };
  try {
    const raw = JSON.parse((await fs.readFile(file, 'utf8')).replace(/^﻿/, ''));
    const r = SitemapSchema.safeParse(raw);
    if (!r.success) return { sitemap: null, error: `${SITEMAP_FILE} sai định dạng: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` };
    return { sitemap: r.data };
  } catch (e) {
    return { sitemap: null, error: `${SITEMAP_FILE} không phải JSON hợp lệ (${(e as Error).message})` };
  }
}

// ---------- Đọc trang ----------

const MOTION_ATTRS = {
  1: ['data-reveal', 'data-count-to', 'data-header'],
  2: ['data-split', 'data-reveal-stagger', 'data-parallax', 'data-marquee', 'data-drag-scroll', 'data-float', 'data-gradient-shift', 'data-clouds', 'data-particles'],
  3: ['data-sky', 'data-layers', 'data-depth', 'data-scene', 'data-step', 'data-scrub', 'data-cursor', 'data-tilt', 'data-magnetic', 'data-spotlight'],
} as const;
const ATMOS_ATTRS = ['data-float', 'data-gradient-shift', 'data-clouds', 'data-particles', 'data-sky', 'data-layers', 'data-scene'];

const FEATURES: [string, string][] = [
  ['[data-menu-toggle]', 'Menu thu gọn trên điện thoại'],
  ['[data-scrollspy]', 'Đánh dấu mục đang xem trên menu'],
  ['[data-tabs]', 'Tabs'],
  ['[data-accordion]', 'Accordion (mở / đóng nội dung)'],
  ['[data-switch]', 'Công tắc chuyển nội dung (ví dụ giá tháng / năm)'],
  ['[data-filter-group]', 'Lọc theo nhóm'],
  ['[data-carousel]', 'Carousel'],
  ['[data-compare]', 'So sánh ảnh trước / sau'],
  ['[data-countdown]', 'Đếm ngược'],
  ['[data-lightbox]', 'Phóng to ảnh (lightbox)'],
  ['[data-modal-open]', 'Cửa sổ (modal)'],
  ['[data-copy]', 'Sao chép nhanh (số điện thoại / email)'],
  ['form[data-form]', 'Form có kiểm tra dữ liệu — bản demo, không gửi đi đâu (chưa có backend)'],
  ['[data-back-to-top]', 'Nút về đầu trang'],
];

interface PageInfo {
  file: string;
  lang: string;
  title: string;
  /** ảnh cục bộ đang dùng (đường dẫn tương đối trong website) */
  images: string[];
  sections: { id: string; variant: string }[];
  features: string[];
  headerLinks: string[];
  letters: number;
  motion: Record<string, number>;
}

const VI_CHARS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/giu;
const CJK = /[一-鿿]/gu;
const KANA = /[぀-ヿ]/gu;
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
const isLocal = (u: string) => !!u && !/^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(u);
const cleanRef = (u: string) => decodeURI(u.split('#')[0].split('?')[0]).replace(/^\.\//, '');

async function readPage(target: string, file: string): Promise<{ info: PageInfo; dom: JSDOM; html: string }> {
  const html = await fs.readFile(path.join(target, file), 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const dir = path.posix.dirname(file);
  const resolve = (u: string) => path.posix.normalize(path.posix.join(dir === '.' ? '' : dir, cleanRef(u)));
  const images = new Set<string>();
  doc.querySelectorAll('img[src], source[srcset], img[srcset]').forEach((el) => {
    const src = el.getAttribute('src');
    if (src && isLocal(src)) images.add(resolve(src));
    for (const part of (el.getAttribute('srcset') ?? '').split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u && isLocal(u)) images.add(resolve(u));
    }
  });
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) if (isLocal(m[1]) && /\.(jpe?g|png|webp|avif|gif)$/i.test(cleanRef(m[1]))) images.add(resolve(m[1]));
  const body = doc.body?.cloneNode(true) as HTMLElement | undefined;
  body?.querySelectorAll('script,style,noscript,template').forEach((n) => n.remove());
  const text = body?.textContent ?? '';
  const motion: Record<string, number> = {};
  for (const attr of Object.values(MOTION_ATTRS).flat()) {
    const n = doc.querySelectorAll(`[${attr}]`).length;
    if (n) motion[attr] = n;
  }
  const clip = doc.querySelectorAll('[data-reveal="clip"]').length;
  if (clip) motion['data-reveal="clip"'] = clip;
  return {
    html,
    dom,
    info: {
      file,
      lang: doc.documentElement.getAttribute('lang') ?? '',
      title: doc.title ?? '',
      images: [...images],
      sections: Array.from(doc.querySelectorAll('section[id], header[id], footer[id]')).map((s) => ({ id: s.id, variant: s.getAttribute('data-section') ?? '' })),
      features: FEATURES.filter(([sel]) => doc.querySelector(sel)).map(([, label]) => label),
      headerLinks: [
        ...new Set(
          Array.from(doc.querySelectorAll('header a[href]'))
            .map((a) => a.getAttribute('href') ?? '')
            .filter((h) => isLocal(h) && /\.html$/i.test(cleanRef(h)))
            .map(resolve),
        ),
      ].sort(),
      letters: count(text, /\p{L}/gu),
      motion,
    },
  };
}

export interface SiteAudit {
  sitemap: Sitemap | null;
  sitemapError?: string;
  pages: PageInfo[];
  issues: Issue[];
  images: { downloaded: Credit[]; used: string[]; unused: string[] };
  motion: { level?: number; counts: Record<string, number>; atmosLoaded: boolean };
  /** Tóm tắt kiểm tra ngôn ngữ / thương hiệu / màu / font để ghi README */
  checks: { label: string; ok: boolean; detail: string }[];
}

export async function auditSite(target: string, pages: string[], conceptRaw: Concept | undefined, request = ''): Promise<SiteAudit> {
  const concept = ConceptSchema.parse(conceptRaw ?? {});
  const lang = languageOf(concept.language);
  const issues: Issue[] = [];
  const checks: SiteAudit['checks'] = [];
  const add = (severity: Issue['severity'], category: string, message: string, page?: string) => issues.push({ severity, category, message, page });

  const { sitemap, error: sitemapError } = await readSitemap(target);
  if (sitemapError) add('minor', 'Sitemap', `${sitemapError} — README không liệt kê được vai trò từng trang.`);

  const loaded = await Promise.all(pages.map((p) => readPage(target, p)));
  const infos = loaded.map((l) => l.info);
  const byFile = new Map(loaded.map((l) => [l.info.file, l]));

  // 1. Số trang & sitemap ↔ trang thật
  if (pages.length < 2) {
    const why = (sitemap?.adjustments ?? []).find((a) => /(1|một|one|single)[ -]?(trang|page)/i.test(a));
    add(why ? 'minor' : 'major', 'Cấu trúc website', why ? `Website chỉ có 1 trang (AI ghi lý do: ${why})` : 'Website chỉ có 1 trang — chế độ này dựng website nhiều trang theo sitemap.');
  }
  if (sitemap) {
    const listed = new Set(sitemap.pages.map((p) => cleanRef(p.file)));
    for (const f of listed) if (!pages.includes(f)) add('major', 'Sitemap', `Trang ${f} có trong sitemap nhưng chưa được tạo.`);
    for (const f of pages) if (!listed.has(f)) add('minor', 'Sitemap', `Trang ${f} không có trong sitemap.json.`, f);
    // Section BA chọn phải có chỗ trong sitemap (hoặc được ghi lý do điều chỉnh)
    const placed = new Set(sitemap.pages.flatMap((p) => (p.sections ?? []).map((s) => s.catalog ?? '')));
    const adj = (sitemap.adjustments ?? []).join(' ').toLowerCase();
    for (const s of concept.sections) {
      const label = sectionOf(s.id)?.label ?? s.id;
      if (!placed.has(s.id) && !adj.includes(s.id) && !adj.includes(label.split(' / ')[0].toLowerCase()))
        add('minor', 'Section BA chọn', `Section "${label}" BA chọn chưa có trong sitemap và không có ghi chú điều chỉnh.`);
    }
  }

  // 2. Ngôn ngữ
  const langBad = new Set<string>();
  for (const p of infos) {
    if (p.lang.toLowerCase() !== lang.htmlLang.toLowerCase()) {
      add('major', 'Ngôn ngữ', `<html lang="${p.lang}"> — cần lang="${lang.htmlLang}" (${lang.name}).`, p.file);
      langBad.add(p.file);
    }
    const text = byFile.get(p.file)!.dom.window.document.body?.textContent ?? '';
    if (p.letters < 150) continue;
    const vi = count(text, VI_CHARS);
    const cjk = count(text, CJK);
    const kana = count(text, KANA);
    let wrong = '';
    if (concept.language === 'vi' && vi < Math.max(10, p.letters * 0.01)) wrong = 'gần như không có chữ tiếng Việt có dấu';
    if (concept.language === 'en' && vi > 15) wrong = `có ${vi} ký tự tiếng Việt có dấu`;
    if (concept.language === 'zh' && cjk / p.letters < 0.3) wrong = 'phần lớn chữ không phải chữ Hán';
    if (concept.language === 'zh' && kana > 10) wrong = 'có chữ kana tiếng Nhật';
    if (concept.language === 'ja' && ((cjk + kana) / p.letters < 0.3 || kana === 0)) wrong = 'phần lớn chữ không phải tiếng Nhật';
    if (wrong) {
      add('major', 'Ngôn ngữ', `Nội dung trang ${wrong} — website chọn ${lang.name}.`, p.file);
      langBad.add(p.file);
    }
  }
  checks.push({ label: 'Ngôn ngữ', ok: langBad.size === 0, detail: langBad.size ? `${langBad.size} trang chưa đúng ${lang.name}: ${[...langBad].join(', ')}` : `Mọi trang lang="${lang.htmlLang}", nội dung ${lang.name}` });

  // 3. Tên thương hiệu
  if (concept.brand) {
    const b = norm(concept.brand);
    const missing = infos.filter((p) => {
      const doc = byFile.get(p.file)!.dom.window.document;
      const chrome = norm(`${doc.title} ${doc.querySelector('header')?.textContent ?? ''} ${doc.querySelector('footer')?.textContent ?? ''}`);
      return !chrome.includes(b);
    });
    for (const p of missing) add('minor', 'Thương hiệu', `Không thấy tên "${concept.brand}" ở <title> / header / footer.`, p.file);
    checks.push({ label: 'Tên thương hiệu', ok: !missing.length, detail: missing.length ? `Thiếu ở ${missing.map((p) => p.file).join(', ')}` : `"${concept.brand}" có ở title / header / footer mọi trang` });
  }

  // 4. Menu nhất quán + link giả / neo không tồn tại
  const home = infos.find((p) => p.file === 'index.html');
  if (home && home.headerLinks.length)
    for (const p of infos)
      if (p !== home && p.headerLinks.length && p.headerLinks.join('|') !== home.headerLinks.join('|'))
        add('minor', 'Điều hướng', `Menu header khác trang chủ (${p.headerLinks.join(', ')} ≠ ${home.headerLinks.join(', ')}).`, p.file);
  for (const { info, dom } of loaded) {
    const doc = dom.window.document;
    const fake = Array.from(doc.querySelectorAll('a[href]')).filter((a) => /^(#|javascript:.*|)$/i.test((a.getAttribute('href') ?? '').trim()));
    if (fake.length) add('major', 'Link giả', `${fake.length} link href="#" / rỗng / javascript: — mọi nút / link phải dẫn tới trang, section hoặc hành động thật.`, info.file);
    for (const a of Array.from(doc.querySelectorAll('a[href]'))) {
      const href = a.getAttribute('href') ?? '';
      const [file, hash] = href.split('#');
      if (!hash || /^(https?:|mailto:|tel:)/i.test(href)) continue;
      const targetFile = file ? path.posix.normalize(path.posix.join(path.posix.dirname(info.file) === '.' ? '' : path.posix.dirname(info.file), cleanRef(file))) : info.file;
      const tdoc = byFile.get(targetFile)?.dom.window.document;
      if (tdoc && !tdoc.getElementById(decodeURIComponent(hash))) add('major', 'Link hỏng', `Link ${href} trỏ tới #${hash} không có trong ${targetFile}.`, info.file);
    }
  }

  // 5. Mức chuyển động thể hiện trong code
  const { preset } = resolvePreset(request, concept);
  const level = concept.motion === 'auto' ? preset?.motion : Number(concept.motion);
  const counts: Record<string, number> = {};
  for (const p of infos) for (const [k, v] of Object.entries(p.motion)) counts[k] = (counts[k] ?? 0) + v;
  const atmosLoaded = loaded.some((l) => /assets\/js\/atmos\.js/.test(l.html));
  const has = (attrs: readonly string[]) => attrs.filter((a) => counts[a]);
  if (level === 1) {
    const over = [...has(ATMOS_ATTRS), ...has(MOTION_ATTRS[3])];
    if (over.length || atmosLoaded) add('major', 'Mức chuyển động', `BA chọn Level 1 nhưng trang dùng ${[...new Set(over)].join(', ') || 'atmos.js'} — chỉ được reveal / đếm số / hover.`);
  } else if (level === 2) {
    const over = has(['data-sky', 'data-layers', 'data-scene', 'data-scrub', 'data-cursor', 'data-tilt', 'data-magnetic']);
    if (over.length) add('major', 'Mức chuyển động', `BA chọn Level 2 nhưng trang dùng hiệu ứng Level 3: ${over.join(', ')}.`);
    if (!has(MOTION_ATTRS[2]).length && !counts['data-reveal="clip"']) add('minor', 'Mức chuyển động', 'BA chọn Level 2 nhưng chưa có hiệu ứng Level 2 nào (split / clip / parallax / stagger…).');
  } else if (level === 3 && !has(MOTION_ATTRS[3]).length) add('minor', 'Mức chuyển động', 'BA chọn Level 3 nhưng chưa có hiệu ứng Level 3 nào (sky / layers / scene / scrub…).');
  const css = existsSync(path.join(target, 'assets/css/site.css')) ? await fs.readFile(path.join(target, 'assets/css/site.css'), 'utf8') : '';
  const inlineCss = loaded.map((l) => Array.from(l.dom.window.document.querySelectorAll('style')).map((s) => s.textContent).join('\n')).join('\n');
  if (/@keyframes|animation\s*:/.test(css + inlineCss) && !/prefers-reduced-motion/.test(css + inlineCss))
    add('major', 'Chuyển động', 'CSS tự viết có animation nhưng không có @media (prefers-reduced-motion: reduce).');

  // 6. Màu & font BA yêu cầu có thật trong code
  const twConfig = existsSync(path.join(target, 'assets/js/tw-config.js')) ? await fs.readFile(path.join(target, 'assets/js/tw-config.js'), 'utf8') : '';
  const allCode = `${twConfig}\n${css}\n${loaded.map((l) => l.html).join('\n')}`.toLowerCase();
  const hexes = [...new Set((concept.colors.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? []).map((h) => h.toLowerCase()))];
  if (hexes.length) {
    const unused = hexes.filter((h) => !allCode.includes(h));
    if (unused.length) add('major', 'Màu BA yêu cầu', `Chưa dùng mã màu BA yêu cầu: ${unused.join(', ')}.`);
    checks.push({ label: 'Màu BA yêu cầu', ok: !unused.length, detail: unused.length ? `Thiếu ${unused.join(', ')}` : `Có trong code: ${hexes.join(', ')}` });
  } else if (concept.colors) checks.push({ label: 'Màu BA yêu cầu', ok: true, detail: `Mô tả bằng lời («${concept.colors}») — không kiểm được bằng code, xem ảnh chụp QA.` });
  if (concept.font) {
    const fam = familyName(concept.font).toLowerCase();
    const found = allCode.includes(fam) || allCode.includes(fam.replace(/ /g, '+'));
    if (!found) add('major', 'Font BA yêu cầu', `Không thấy font "${familyName(concept.font)}" trong code.`);
    checks.push({ label: 'Font BA yêu cầu', ok: found, detail: found ? `"${familyName(concept.font)}" có trong font-family / Google Fonts` : 'Chưa dùng' });
  }

  // 7. Ảnh: tải về ↔ dùng trong trang
  const downloaded = await readCredits(target);
  const used = [...new Set(infos.flatMap((p) => p.images).concat([...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => path.posix.normalize(path.posix.join('assets/css', cleanRef(m[1]))))))].filter((u) =>
    u.startsWith(`${IMG_DIR}/`),
  );
  const unused = downloaded.map((c) => c.file).filter((f) => !used.includes(f));
  if (unused.length) add('minor', 'Ảnh chưa dùng', `${unused.length} ảnh đã tải nhưng không trang nào dùng: ${unused.slice(0, 6).join(', ')}${unused.length > 6 ? '…' : ''}.`);
  for (const p of sitemap?.pages ?? [])
    for (const im of p.images ?? [])
      if (im.status === 'ok' && im.file && !used.includes(cleanRef(im.file))) add('minor', 'Ảnh chưa dùng', `sitemap ghi ảnh ${im.file} cho "${im.slot}" nhưng trang không dùng.`, p.file);

  return { sitemap, sitemapError, pages: infos, issues, images: { downloaded, used, unused }, motion: { level, counts, atmosLoaded }, checks };
}

// ---------- Chẩn đoán chuỗi ảnh (7 trường hợp) ----------

export interface ImageDiagnosis {
  code: 'ok' | 'not_called' | 'tool_missing' | 'mcp_disconnected' | 'tool_error' | 'no_results' | 'not_integrated' | 'not_loading' | 'unavailable';
  label: string;
  detail: string;
}

type Ev = Record<string, any>;

export function diagnoseImages(events: Ev[], audit: SiteAudit, qa: QaReport | null): ImageDiagnosis[] {
  const out: ImageDiagnosis[] = [];
  const preflight = [...events].reverse().find((e) => e.ev === 'preflight');
  const init = events.filter((e) => e.ev === 'mcp_init');
  const calls = events.filter((e) => e.ev === 'agent_calls');
  const searches = events.filter((e) => e.ev === 'search');
  const uses = events.filter((e) => e.ev === 'use');
  const searchCalls = calls.reduce((n, c) => n + (c.calls?.['mcp__images__search_images'] ?? 0), 0);

  if (preflight && !preflight.ok) out.push({ code: 'unavailable', label: 'Dịch vụ ảnh không khả dụng', detail: `Kiểm tra trước khi dựng: ${preflight.error}` });
  const disconnected = init.flatMap((e) => (e.servers ?? []).filter((s: Ev) => s.name === 'images' && s.status !== 'connected'));
  if (disconnected.length) out.push({ code: 'mcp_disconnected', label: 'MCP ảnh không kết nối', detail: `Trạng thái: ${disconnected.map((s) => s.status).join(', ')}` });
  const missing = [...new Set(init.flatMap((e) => (e.missing ?? []).filter((t: string) => t.startsWith('mcp__images__'))))];
  if (missing.length) out.push({ code: 'tool_missing', label: 'Tool ảnh không có trong danh sách tool của AI', detail: missing.join(', ') });
  if (init.length && !disconnected.length && !missing.length && calls.length && searchCalls === 0 && !(preflight && !preflight.ok))
    out.push({ code: 'not_called', label: 'AI không gọi tool tìm ảnh', detail: 'MCP đã kết nối, tool đã đăng ký nhưng không có lượt gọi search_images nào.' });
  const failed = searches.filter((s) => s.error);
  if (searches.length && failed.length === searches.length)
    out.push({ code: 'tool_error', label: 'Tool tìm ảnh trả lỗi', detail: [...new Set(failed.map((s) => `${s.kind}: ${s.error}`))].slice(0, 3).join(' | ') });
  else if (failed.length) out.push({ code: 'tool_error', label: 'Một số lượt tìm ảnh lỗi', detail: `${failed.length}/${searches.length} lượt lỗi (${[...new Set(failed.map((s) => s.kind))].join(', ')})` });
  const okSearches = searches.filter((s) => !s.error);
  if (okSearches.length && okSearches.every((s) => !s.count)) out.push({ code: 'no_results', label: 'Không tìm được ảnh', detail: `${okSearches.length} lượt tìm đều 0 kết quả` });
  const downloadedOk = uses.filter((u) => u.file && !u.error);
  if ((downloadedOk.length || audit.images.downloaded.length) && audit.images.unused.length)
    out.push({ code: 'not_integrated', label: 'Tìm được ảnh nhưng chưa tích hợp vào trang', detail: `${audit.images.unused.length} ảnh chưa dùng: ${audit.images.unused.slice(0, 4).join(', ')}` });
  const broken = (qa?.issues ?? []).filter((i) => i.category === 'Ảnh hỏng' || i.category === 'Ảnh không đúng nguồn');
  if (broken.length) out.push({ code: 'not_loading', label: 'Ảnh trong trang không tải được / sai nguồn', detail: broken.slice(0, 3).map((i) => `${i.page}: ${i.message}`).join(' | ') });
  if (!out.length) out.push({ code: 'ok', label: 'Chuỗi ảnh hoạt động', detail: `${audit.images.used.length} ảnh được dùng trên ${audit.pages.filter((p) => p.images.length).length} trang` });
  return out;
}

// ---------- README của website ----------

async function tree(target: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string, depth: number) => {
    const entries = (await fs.readdir(dir, { withFileTypes: true })).filter((e) => !['_qa', 'node_modules', '.git'].includes(e.name) && e.name !== '_qa-report.md');
    entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
    for (const e of entries) {
      const rel = path.relative(target, path.join(dir, e.name)).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (rel === IMG_DIR) {
          const n = (await fs.readdir(path.join(dir, e.name))).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).length;
          out.push(`${'  '.repeat(depth)}${e.name}/  (${n} ảnh + CREDITS.md)`);
          continue;
        }
        out.push(`${'  '.repeat(depth)}${e.name}/`);
        await walk(path.join(dir, e.name), depth + 1);
      } else out.push(`${'  '.repeat(depth)}${e.name}`);
    }
  };
  await walk(target, 0);
  return out;
}

const ROLE: Record<string, string> = {
  'assets/js/tw-config.js': 'Cấu hình Tailwind dùng chung: màu, font (một nguồn cho mọi trang)',
  'assets/css/site.css': 'Biến CSS (:root) và vài style Tailwind không làm được',
  'assets/js/ui.js': 'Tool sinh — menu, tabs, accordion, carousel, lightbox, modal, form (qua data-*)',
  'assets/js/motion.js': 'Tool sinh — hiệu ứng cuộn / hover (qua data-*), tôn trọng prefers-reduced-motion',
  'assets/js/atmos.js': 'Tool sinh — không khí: mây, hạt sáng, cảnh nhiều lớp (Level 2–3)',
  'assets/js/site.js': 'Logic riêng của website (do AI viết)',
};

export interface ReadmeInput {
  target: string;
  name: string;
  concept: Concept | undefined;
  request: string;
  audit: SiteAudit;
  qa: QaReport | null;
  /** Log ảnh của mọi lần chạy (logs/images.jsonl) */
  imageEvents: Ev[];
  /** Lịch sử tác vụ (logs/jobs.jsonl) */
  jobs: Ev[];
  fontChecks?: FontCheck[];
  revisions?: { createdAt: string; text: string }[];
}

const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export async function writeSiteReadme(o: ReadmeInput): Promise<void> {
  const c = ConceptSchema.parse(o.concept ?? {});
  const { preset, how } = resolvePreset(o.request, c);
  const sm = o.audit.sitemap;
  const smPreset = sm?.preset ? PRESETS.find((p) => p.id === sm.preset) : undefined;
  const lang = languageOf(c.language);
  const level = o.audit.motion.level;
  const L: string[] = [];

  L.push(
    `# ${c.brand || o.name}`,
    '',
    '> README này do **BA Tool sinh tự động** sau khi dựng và kiểm thử website — chỉ ghi những gì kiểm chứng được từ cấu hình, file thật trong thư mục, log của tool và kết quả QA. Đây không phải README của hệ thống tạo website.',
    '',
    '## 1. Giới thiệu & mục tiêu',
    '',
    `- **Chủ đề:** ${c.topic || o.request || '—'}`,
    `- **Thương hiệu / dự án:** ${c.brand || '—'}`,
    `- **Mục đích:** ${c.purpose || (sm?.purposeInferred ? `${sm.purposeInferred} _(AI suy luận — BA không ghi)_` : '— (BA không ghi)')}`,
  );
  if (sm?.visualIdea) L.push(`- **Ý tưởng thị giác (AI ghi):** ${sm.visualIdea}`);
  L.push('');

  L.push('## 2. Cấu hình đã chọn', '', '| Mục | Giá trị |', '|---|---|');
  L.push(`| Ngôn ngữ | ${lang.label} (\`lang="${lang.htmlLang}"\`) |`);
  L.push(`| Phong cách | ${preset ? `${preset.name} — ${how === 'chosen' ? 'BA chọn' : 'tool nhận diện từ mô tả'}` : smPreset ? `${smPreset.name} — AI tự chọn` : 'AI tự chọn'} |`);
  L.push(`| Mức chuyển động | ${level ? `Level ${level}` : 'theo preset'}${c.motion === 'auto' ? ' (mặc định của preset)' : ' (BA chọn)'} |`);
  L.push(`| Màu sắc | ${c.colors ? esc(c.colors) : 'BA để trống — theo preset / AI chọn'} |`);
  L.push(`| Font | ${c.font ? esc(c.font) : 'BA để trống — theo preset / AI chọn'} |`);
  L.push(`| Section BA chọn | ${c.sections.length ? c.sections.map((s) => `${sectionOf(s.id)?.label ?? s.id}${s.description ? ' (có mô tả)' : ''}`).join('; ') : 'Không chọn — AI đề xuất'} |`);
  L.push(`| Chú thích bổ sung | ${c.notes.trim() ? `${c.notes.length.toLocaleString('vi-VN')} ký tự (lưu đầy đủ trong project.json của BA Tool)` : 'Không có'} |`);
  L.push('');
  if (o.fontChecks?.length) {
    L.push('Kiểm tra font (Google Fonts, trước khi dựng):', '');
    for (const f of o.fontChecks)
      L.push(`- \`${f.family}\`: ${f.onGoogleFonts === false ? 'không có trên Google Fonts' : f.supports === true ? `đủ ký tự ${lang.name}` : f.supports === false ? `thiếu ký tự ${lang.name} → cần fallback` : `chưa xác định${f.note ? ` (${f.note})` : ''}`}`);
    L.push('');
  }

  L.push('## 3. Sitemap & vai trò từng trang', '');
  const pageMeta = new Map((sm?.pages ?? []).map((p) => [p.file.replace(/^\.\//, ''), p]));
  L.push('| Trang | Tiêu đề | Vai trò (AI ghi trong sitemap) | Section (id → biến thể) | Ảnh |', '|---|---|---|---|---|');
  for (const p of o.audit.pages) {
    const m = pageMeta.get(p.file);
    L.push(
      `| \`${p.file}\` | ${esc(p.title)} | ${esc(m?.purpose ?? '—')} | ${p.sections.map((s) => `${s.id}${s.variant ? ` → ${s.variant}` : ''}`).join(', ') || '—'} | ${p.images.length} |`,
    );
  }
  if (!sm) L.push('', `> ${o.audit.sitemapError ?? 'Không có sitemap.json'} — cột "Vai trò" để trống.`);
  L.push('');

  L.push('## 4. Cấu trúc thư mục', '', '```', ...(await tree(o.target)), '```', '');
  if (existsSync(path.join(o.target, '_build'))) L.push('`_build/` là dữ liệu nội bộ của BA Tool (sitemap AI ghi) — không cần khi đưa website lên.', '');

  L.push('## 5. Tổ chức code & thành phần chính', '');
  for (const [file, role] of Object.entries(ROLE)) if (existsSync(path.join(o.target, file))) L.push(`- \`${file}\` — ${role}`);
  L.push(
    '- Mỗi trang là một file HTML tĩnh, header / footer giống nhau; mỗi khối nội dung là `<section id data-section="<biến thể>">` để sửa riêng từng khối.',
    '- Tailwind CSS nạp qua CDN (`cdn.tailwindcss.com`), font qua Google Fonts.',
    '',
  );

  L.push('## 6. Hình ảnh: tìm kiếm & tích hợp', '');
  const diag = diagnoseImages(o.imageEvents, o.audit, o.qa);
  L.push(...diag.map((d) => `- **${d.code === 'ok' ? '✓' : '⚠'} ${d.label}:** ${d.detail}`), '');
  const searches = o.imageEvents.filter((e) => e.ev === 'search');
  if (searches.length) {
    const providers = [...new Set(searches.filter((s) => s.provider).map((s) => s.provider))];
    L.push(
      `Tool đã ghi ${searches.length} lượt tìm (nguồn: ${providers.join(', ') || '—'}), ${o.imageEvents.filter((e) => e.ev === 'use' && e.file && !e.error && !e.reused).length} lượt tải thành công.`,
      '',
      '| Từ khóa | Nguồn | Kết quả | Thời gian |',
      '|---|---|---|---|',
      ...searches.slice(-40).map((s) => `| ${esc(s.query)} | ${s.provider ?? '—'} | ${s.error ? `lỗi ${s.kind}` : `${s.count} ảnh`} | ${s.ms ?? 0} ms |`),
      '',
    );
  }
  if (o.audit.images.downloaded.length) {
    L.push('| File | Dùng cho | Nguồn | Giấy phép | Đang dùng |', '|---|---|---|---|---|');
    for (const cr of o.audit.images.downloaded) L.push(`| \`${cr.file}\` | ${esc(cr.purpose)} | ${cr.source} | ${esc(cr.license)} | ${o.audit.images.used.includes(cr.file) ? '✓' : '✗'} |`);
    L.push('', 'Ghi công đầy đủ: `assets/img/CREDITS.md`. Khi đưa lên web thật, giữ ghi công theo giấy phép hoặc thay bằng ảnh của khách.', '');
  }
  const noImg = (sm?.pages ?? []).flatMap((p) => (p.images ?? []).filter((i) => i.status === 'none').map((i) => `${p.file} — ${i.slot}${i.query ? ` (từ khóa dự kiến: "${i.query}")` : ''}`));
  if (noImg.length) L.push('Vị trí chưa có ảnh (đang dùng bố cục không ảnh, cần ảnh thật từ khách):', '', ...noImg.map((x) => `- ${x}`), '');

  L.push('## 7. Chức năng đã triển khai', '');
  const feats = [...new Set(o.audit.pages.flatMap((p) => p.features))];
  L.push(...(feats.length ? feats.map((f) => `- ${f}`) : ['- Chỉ nội dung tĩnh và điều hướng giữa các trang.']));
  L.push(`- Điều hướng: ${o.audit.pages.length} trang liên kết qua header / footer${o.audit.pages[0]?.headerLinks.length ? ` (menu: ${o.audit.pages.find((p) => p.file === 'index.html')?.headerLinks.join(', ')})` : ''}.`);
  const mc = Object.entries(o.audit.motion.counts);
  if (mc.length) L.push(`- Chuyển động (đếm trong code): ${mc.map(([k, v]) => `\`${k}\` ×${v}`).join(', ')}${o.audit.motion.atmosLoaded ? '; có nạp atmos.js' : ''}.`);
  L.push('');

  L.push('## 8. Kiểm thử & kết quả', '');
  if (o.qa) {
    const n = (s: string) => o.qa!.issues.filter((i) => i.severity === s).length;
    L.push(
      `- QA tự động (Playwright) lúc ${fmt(o.qa.createdAt)}: ${o.qa.pages.length} trang × 3 kích thước (375 / 768 / 1440px) + đo bề ngang ở 1920px — ${n('critical')} nghiêm trọng, ${n('major')} cần sửa, ${n('minor')} gợi ý. Chi tiết: \`_qa-report.md\` (bản tải về không kèm thư mục QA).`,
    );
  } else L.push('- QA tự động chưa chạy được.');
  for (const ck of o.audit.checks) L.push(`- ${ck.ok ? '✓' : '✗'} ${ck.label}: ${ck.detail}`);
  const previewCalls = o.jobs.length ? o.imageEvents.filter((e) => e.ev === 'agent_calls').reduce((n, e) => n + (e.calls?.['mcp__preview__view_page'] ?? 0) + (e.calls?.['mcp__preview__check_page'] ?? 0), 0) : 0;
  if (previewCalls) L.push(`- AI tự xem lại trang bằng công cụ preview: ${previewCalls} lượt chụp / kiểm.`);
  L.push('');

  L.push('## 9. Lịch sử dựng, lỗi đã sửa & giới hạn còn lại', '');
  if (o.jobs.length) {
    L.push('| Thời điểm | Tác vụ | Kết quả |', '|---|---|---|');
    for (const j of o.jobs.slice(-15)) L.push(`| ${fmt(j.endedAt ?? j.startedAt)} | ${j.kind === 'quick-prototype' ? 'Dựng website' : j.kind === 'quick-revise' ? `Sửa${j.feedback ? `: ${esc(String(j.feedback).slice(0, 120))}` : ' theo QA'}` : j.kind} | ${j.status === 'done' ? 'xong' : `lỗi: ${esc(j.error ?? '')}`} |`);
    L.push('');
  }
  if (sm?.adjustments?.length) L.push('Điều chỉnh so với yêu cầu (AI ghi):', '', ...sm.adjustments.map((a) => `- ${a}`), '');
  const open = (o.qa?.issues ?? []).filter((i) => i.severity !== 'minor');
  if (open.length) L.push('Lỗi QA còn mở:', '', ...open.slice(0, 15).map((i) => `- [${i.category}] ${i.page ?? ''}: ${i.message}`), '');
  L.push('Giới hạn:', '', ...(sm?.limitations?.length ? sm.limitations.map((x) => `- ${x}`) : []), '- Form là bản demo: kiểm tra dữ liệu và lưu tạm trong trình duyệt (localStorage), **không gửi đi đâu** — cần backend / dịch vụ form khi chạy thật.', '- Nội dung, số liệu, tên người trong website là nội dung mẫu, cần khách xác nhận.', '');

  L.push(
    '## 10. Cài đặt & chạy',
    '',
    'Website tĩnh, **không có bước cài đặt hay build**.',
    '',
    '- Mở trực tiếp: nhấp đúp `index.html` (chạy được qua `file://`).',
    '- Hoặc chạy máy chủ tĩnh trong thư mục này: `npx serve .` (cần Node.js) rồi mở địa chỉ được in ra.',
    '- Cần Internet để nạp Tailwind CDN và Google Fonts. Khi đưa lên production nên build Tailwind thành file CSS tĩnh thay cho CDN.',
    '- Đưa lên hosting tĩnh (Netlify, Vercel, GitHub Pages…): tải toàn bộ thư mục, có thể bỏ `_build/`.',
    '',
    '## 11. Biến môi trường',
    '',
    '- Website **không cần** biến môi trường nào.',
    '- Chỉ BA Tool (khi dựng lại / đổi ảnh) dùng tùy chọn `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY` trong `.env` của tool — không đặt thì tool dùng Openverse. Không ghi giá trị khóa vào website.',
    '',
  );

  await fs.writeFile(path.join(o.target, 'README.md'), L.join('\n'), 'utf8');
}
