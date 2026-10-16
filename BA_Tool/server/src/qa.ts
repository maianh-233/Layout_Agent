// QA prototype bằng Playwright (chỉ trong tool, không đưa vào prototype):
//   - mở mọi trang ở 375 / 768 / 1440px qua file:// (đúng cách khách mở), chụp ảnh
//   - lỗi console / lỗi JS, file không tải được, link nội bộ hỏng, tràn ngang, data-screen sai
//   - đăng nhập lần lượt từng vai trò: menu chỉ có mục được phép, trang cấm hiện "Không có quyền truy cập"
//   - màn hình trong registry chưa có trang, chỗ hardcode giá trị thiết kế
// Kết quả: <prototype>/_qa/report.json, <prototype>/_qa-report.md, ảnh ở <prototype>/_qa/screens/.
// Đồng thời sinh HANDOFF.md cho đội frontend (toàn bộ bằng code).
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Browser, BrowserContext } from 'playwright';
import { checkRegistry, type Permissions, type Registry } from './registry.js';
import { screenPaths, type ScreenMeta } from './prototype-runtime.js';
import { listPages, scanHardcoded } from './prototype-assets.js';
import { SEVERITY_LABELS, type Severity } from './review.js';
import { DesignTokensSchema, TOKENS_FILE } from './design.js';

export const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

export interface QaIssue {
  id: string;
  severity: Severity;
  category: string;
  message: string;
  page?: string;
  viewport?: string;
}

export interface QaRoleResult {
  role: string;
  name: string;
  home: string | null;
  menu: string[];
  forbiddenInMenu: string[];
  noPermissionPage: { path: string; ok: boolean } | null;
}

export interface QaReport {
  createdAt: string;
  pages: string[];
  screenshots: { page: string; viewport: string; file: string }[];
  roles: QaRoleResult[];
  issues: QaIssue[];
}

const QA_DIR = '_qa';
export const QA_JSON = `${QA_DIR}/report.json`;
export const QA_MD = '_qa-report.md';

const shotName = (page: string, vp: string) => `${QA_DIR}/screens/${page.replace(/\.html$/, '').replace(/[^a-zA-Z0-9-]+/g, '_')}__${vp}.jpg`;
/** Tài nguyên ngoài (CDN, font) lỗi mạng không tính là lỗi của prototype */
const isExternal = (url: string) => /^https?:/i.test(url);

interface Ctx {
  target: string;
  registry?: Registry;
  permissions?: Permissions;
  screens: ScreenMeta[];
}

/** Vai trò dùng để mở một trang: vai trò đầu tiên được vào (trang không thuộc registry → vai trò đầu tiên). */
function roleFor(ctx: Ctx, page: string): string | null {
  if (page === 'index.html') return null;
  const s = ctx.screens.find((x) => x.path === page);
  const roles = ctx.registry?.roles.map((r) => r.id) ?? [];
  return s?.roles[0] ?? roles[0] ?? null;
}

async function openPage(context: BrowserContext, url: string, role: string | null) {
  const page = await context.newPage();
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Failed to load resource/i.test(m.text())) errors.push(m.text().slice(0, 300));
    // motion.js / atmos.js bỏ qua phần tử lỗi để trang vẫn chạy, nhưng vẫn phải báo để sửa
    else if (m.type() === 'warning' && /^\[(motion|atmos)\]/.test(m.text())) errors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 300)));
  page.on('requestfailed', (r) => {
    if (!isExternal(r.url())) failed.push(r.url());
  });
  await page.addInitScript((r) => {
    try {
      if (r === null) localStorage.removeItem('demo.role');
      else localStorage.setItem('demo.role', r);
    } catch {
      /* bỏ qua */
    }
  }, role);
  let loadError = '';
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(800); // Tailwind JIT + skeleton giả ~400ms
  } catch (e) {
    loadError = (e as Error).message.split('\n')[0];
  }
  return { page, errors, failed, loadError };
}

/**
 * Đo phần bề ngang nội dung thật sự dùng ở màn hình rộng (1920px). Nội dung dồn vào một cột hẹp giữa trang,
 * hai bên trống trơn là lỗi bố cục thường gặp của prototype do AI dựng.
 */
const WIDE = { width: 1920, height: 1080 };
async function measureSpread(page: import('playwright').Page) {
  await page.setViewportSize(WIDE);
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    let left = W;
    let right = 0;
    const sel = 'h1,h2,h3,h4,p,li,img,picture,video,canvas,svg,table,form,input,select,textarea,button,a,label,blockquote,figure';
    for (const el of Array.from(document.body.querySelectorAll(sel))) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0) continue;
      const st = getComputedStyle(el);
      if (st.visibility === 'hidden' || st.position === 'fixed' || Number(st.opacity) === 0) continue;
      // Ảnh / video tràn viền (full-bleed) làm nền thì vẫn tính
      left = Math.max(0, Math.min(left, r.left));
      right = Math.min(W, Math.max(right, r.right));
    }
    return right > left ? { W, used: Math.round(right - left), left: Math.round(left), right: Math.round(W - right) } : null;
  });
}

/** Ảnh trong trang: <img> và background-image (CSS). */
async function collectImages(page: import('playwright').Page) {
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => ((i as HTMLImageElement).loading = 'eager')));
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const out: { src: string; broken: boolean }[] = [];
    for (const img of Array.from(document.images)) {
      const src = img.currentSrc || img.src;
      if (src) out.push({ src, broken: img.complete && img.naturalWidth === 0 });
    }
    for (const el of Array.from(document.body.querySelectorAll('*')).slice(0, 4000)) {
      const bg = getComputedStyle(el).backgroundImage;
      for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) out.push({ src: m[1], broken: false });
    }
    return out;
  });
}

const BANNED_IMG = /picsum\.photos|placehold|placeholder\.com|dummyimage|loremflickr|source\.unsplash|fakeimg|placekitten|images\.unsplash\.com|via\.placeholder/i;

export async function runQa(opts: {
  target: string;
  /** Không có ở chế độ nhanh (landing page không có SRS) */
  srs?: string;
  appName: string;
  /** Chế độ nhanh: bỏ phần registry / vai trò / style guide / HANDOFF */
  quick?: boolean;
  /** Lỗi do kiểm tra khác phát hiện, gộp vào cùng báo cáo để "Sửa theo QA" xử lý luôn */
  extraIssues?: Omit<QaIssue, 'id'>[];
  onProgress?: (text: string) => void;
}): Promise<QaReport> {
  const { target, srs, quick } = opts;
  const progress = opts.onProgress ?? (() => {});
  const check = srs && !quick ? await checkRegistry(srs, 'ui') : null;
  const ctx: Ctx = {
    target,
    registry: check?.registry,
    permissions: check?.permissions,
    screens: srs && check?.registry ? await screenPaths(srs, check.registry) : [],
  };
  const pages = await listPages(target);
  const issues: Omit<QaIssue, 'id'>[] = [];
  // Ảnh do công cụ use_image tải về (images.ts); không có file → prototype chưa dùng công cụ ảnh, chỉ bắt link ngoài
  const creditsFile = path.join(target, 'assets', 'img', '_credits.json');
  const credited = existsSync(creditsFile)
    ? new Set((JSON.parse(await fs.readFile(creditsFile, 'utf8')) as { file: string }[]).map((x) => x.file))
    : null;
  const screenshots: QaReport['screenshots'] = [];
  const add = (i: Omit<QaIssue, 'id'>) => issues.push(i);

  await fs.rm(path.join(target, QA_DIR), { recursive: true, force: true });
  await fs.mkdir(path.join(target, QA_DIR, 'screens'), { recursive: true });

  // Màn hình trong SRS chưa có trang
  for (const s of ctx.screens)
    if (!pages.includes(s.path)) add({ severity: 'major', category: 'Thiếu màn hình', message: `${s.id} (${s.name}) chưa có trang ${s.path}`, page: s.path });
  if (!quick && !pages.includes('components.html')) add({ severity: 'major', category: 'Style guide', message: 'Chưa có trang components.html' });

  const { chromium } = await import('playwright');
  let browser: Browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    throw new Error(`Không khởi động được trình duyệt kiểm thử (Chromium của Playwright). Chạy "npx playwright install chromium" trong thư mục server. Chi tiết: ${(e as Error).message.split('\n')[0]}`);
  }
  const roleNames = new Map((ctx.registry?.roles ?? []).map((r) => [r.id, r.name]));
  const roles: QaRoleResult[] = [];
  try {
    // 1. Từng trang × 3 kích thước
    for (const vp of VIEWPORTS) {
      progress(`QA: mở ${pages.length} trang ở ${vp.width}px…`);
      // Giảm chuyển động: nội dung "hiện dần khi cuộn" (motion.js) hiện ngay để chụp ảnh và đo bố cục đúng
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
      for (let i = 0; i < pages.length; i += 4) {
        await Promise.all(
          pages.slice(i, i + 4).map(async (rel) => {
            const url = pathToFileURL(path.join(target, rel)).href;
            const { page, errors, failed, loadError } = await openPage(context, url, roleFor(ctx, rel));
            try {
              if (loadError) {
                add({ severity: 'critical', category: 'Không mở được trang', message: loadError, page: rel, viewport: vp.name });
                return;
              }
              const shot = shotName(rel, vp.name);
              await page.screenshot({ path: path.join(target, shot), type: 'jpeg', quality: 60 });
              screenshots.push({ page: rel, viewport: vp.name, file: shot });
              const overflow = await page.evaluate(() => {
                const W = document.documentElement.clientWidth;
                const sw = document.documentElement.scrollWidth;
                if (sw <= W + 1) return null;
                const off: string[] = [];
                for (const el of Array.from(document.body.querySelectorAll('*'))) {
                  const r = el.getBoundingClientRect();
                  if (r.width > 0 && r.right > W + 1 && getComputedStyle(el).position !== 'fixed') {
                    const cls = typeof (el as HTMLElement).className === 'string' ? (el as HTMLElement).className.trim().split(/\s+/).slice(0, 3).join('.') : '';
                    off.push(el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls ? `.${cls}` : ''));
                    if (off.length >= 3) break;
                  }
                }
                return { sw, W, off };
              });
              if (overflow)
                add({
                  severity: vp.name === 'mobile' ? 'major' : 'minor',
                  category: 'Tràn ngang',
                  message: `Trang rộng ${overflow.sw}px trong khung ${overflow.W}px. Phần tử tràn: ${overflow.off.join(', ') || 'không xác định'}`,
                  page: rel,
                  viewport: vp.name,
                });
              if (vp.name !== 'desktop') return;
              // Các kiểm tra chỉ cần chạy một lần (ở desktop)
              for (const e of [...new Set(errors)]) add({ severity: 'critical', category: 'Lỗi JavaScript / console', message: e, page: rel });
              for (const f of [...new Set(failed)])
                add({ severity: 'critical', category: 'Không tải được file', message: decodeURIComponent(f.replace(pathToFileURL(target).href, '')), page: rel });
              const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href));
              for (const href of [...new Set(links)]) {
                if (!href.startsWith('file:')) continue;
                const file = fileURLToPath(href.split('#')[0].split('?')[0]);
                if (!existsSync(file)) add({ severity: 'major', category: 'Link hỏng', message: `Link tới ${path.relative(target, file).split(path.sep).join('/')} không tồn tại`, page: rel });
              }
              const spread = await measureSpread(page);
              if (spread && spread.used / spread.W < 0.72) {
                const pct = Math.round((spread.used / spread.W) * 100);
                add({
                  severity: spread.used / spread.W < 0.6 ? 'major' : 'minor',
                  category: 'Bố cục dồn giữa',
                  message: `Ở màn hình ${spread.W}px nội dung chỉ chiếm ${pct}% bề ngang (trống trái ${spread.left}px, phải ${spread.right}px). Nới khung nội dung theo references/layout-guide.md (container rộng, lưới thêm cột ở xl/2xl, nền section tràn viền).`,
                  page: rel,
                  viewport: 'wide',
                });
              }
              // Ảnh: chỉ ảnh thật tải qua use_image (assets/img + _credits.json)
              const seenImg = new Set<string>();
              for (const im of await collectImages(page)) {
                const key = im.src.split('?')[0];
                if (seenImg.has(key)) continue;
                seenImg.add(key);
                const short = im.src.startsWith('data:') ? `${im.src.slice(0, 30)}…` : decodeURIComponent(key.replace(pathToFileURL(target).href + '/', ''));
                if (/^data:image\/(png|jpe?g|webp|gif|avif)/i.test(im.src) && im.src.length > 2000)
                  add({ severity: 'major', category: 'Ảnh tự tạo', message: `Ảnh nhúng base64 (${short}) — phải dùng ảnh thật qua search_images / use_image`, page: rel });
                else if (/^https?:/i.test(im.src)) {
                  if (/fonts\.(googleapis|gstatic)\.com/.test(im.src)) continue;
                  add({
                    severity: 'major',
                    category: 'Ảnh không đúng nguồn',
                    message: `${BANNED_IMG.test(im.src) ? 'Ảnh giữ chỗ / link tự nghĩ' : 'Ảnh lấy từ link ngoài'}: ${im.src.slice(0, 120)} — phải tải qua search_images / use_image về assets/img/`,
                    page: rel,
                  });
                } else if (im.src.startsWith('file:')) {
                  const relImg = path.relative(target, fileURLToPath(key)).split(path.sep).join('/');
                  if (im.broken || !existsSync(path.join(target, relImg))) add({ severity: 'major', category: 'Ảnh hỏng', message: `Không hiển thị được ảnh ${relImg}`, page: rel });
                  else if (/\.(jpe?g|png|webp|avif)$/i.test(relImg) && credited && !credited.has(relImg))
                    add({ severity: 'major', category: 'Ảnh không đúng nguồn', message: `${relImg} không do use_image tải về (không có trong assets/img/CREDITS.md)`, page: rel });
                }
              }
              const expected = ctx.screens.find((s) => s.path === rel);
              if (expected) {
                const ds = await page.evaluate(() => document.body?.getAttribute('data-screen'));
                if (ds !== expected.id) add({ severity: 'minor', category: 'Truy vết', message: `body[data-screen] là "${ds ?? ''}", cần "${expected.id}"`, page: rel });
              }
            } finally {
              await page.close();
            }
          }),
        );
      }
      await context.close();
    }

    // 2. Từng vai trò: menu đúng quyền, trang cấm hiện "Không có quyền truy cập"
    if (ctx.registry && ctx.permissions && pages.includes('index.html')) {
      progress('QA: đăng nhập lần lượt từng vai trò…');
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const login = await openPage(context, pathToFileURL(path.join(target, 'index.html')).href, null);
      const loginText = (await login.page.evaluate(() => document.body?.innerText ?? '')).toLowerCase();
      await login.page.close();
      for (const r of ctx.registry.roles) {
        if (!loginText.includes(r.name.toLowerCase())) add({ severity: 'major', category: 'Đăng nhập / vai trò', message: `Trang đăng nhập không có lựa chọn vai trò "${r.name}"`, page: 'index.html' });
        const allowed = (s: ScreenMeta) => !s.roles.length || s.roles.includes(r.id);
        const homeId = ctx.permissions.defaultScreen[r.id];
        const home = ctx.screens.find((s) => s.id === homeId) ?? ctx.screens.find((s) => allowed(s) && s.path !== 'index.html');
        const result: QaRoleResult = { role: r.id, name: r.name, home: home?.path ?? null, menu: [], forbiddenInMenu: [], noPermissionPage: null };
        if (home && pages.includes(home.path)) {
          const { page } = await openPage(context, pathToFileURL(path.join(target, home.path)).href, r.id);
          const hrefs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('aside a[href], nav a[href], [data-menu] a[href]')).map((a) => (a as HTMLAnchorElement).href),
          );
          await page.close();
          const rels = [...new Set(hrefs.filter((h) => h.startsWith('file:')).map((h) => path.relative(target, fileURLToPath(h.split('#')[0].split('?')[0])).split(path.sep).join('/')))];
          result.menu = rels;
          for (const rel of rels) {
            const s = ctx.screens.find((x) => x.path === rel);
            if (s && !allowed(s)) result.forbiddenInMenu.push(rel);
          }
          if (result.forbiddenInMenu.length)
            add({ severity: 'critical', category: 'Phân quyền', message: `Vai trò "${r.name}" thấy mục menu không được phép: ${result.forbiddenInMenu.join(', ')}`, page: home.path });
        } else if (home) {
          add({ severity: 'major', category: 'Đăng nhập / vai trò', message: `Màn hình mặc định của "${r.name}" (${home.path}) chưa có trang` });
        }
        const forbidden = ctx.screens.find((s) => !allowed(s) && pages.includes(s.path));
        if (forbidden) {
          const { page } = await openPage(context, pathToFileURL(path.join(target, forbidden.path)).href, r.id);
          const text = (await page.evaluate(() => document.body?.innerText ?? '')).toLowerCase();
          await page.close();
          const ok = text.includes('không có quyền');
          result.noPermissionPage = { path: forbidden.path, ok };
          if (!ok) add({ severity: 'critical', category: 'Phân quyền', message: `Vai trò "${r.name}" mở ${forbidden.path} (không được phép) nhưng không thấy trang "Không có quyền truy cập"`, page: forbidden.path });
        }
        roles.push(result);
      }
      await context.close();
    }

    // 3. HANDOFF.md
    if (srs && !quick) {
      progress('QA: đang viết HANDOFF.md cho đội frontend…');
      await writeHandoff({ ...ctx, srs, appName: opts.appName, pages, browser, roleNames });
    }
  } finally {
    await browser.close();
  }

  // Kiểm tra bằng code không cần trình duyệt (chế độ nhanh: sitemap, ngôn ngữ, màu / font BA yêu cầu… — site-report.ts)
  for (const x of opts.extraIssues ?? []) add(x);

  if (!quick)
    for (const h of await scanHardcoded(target, pages))
      add({ severity: 'minor', category: 'Hardcode', message: `${h.count} chỗ dùng mã HEX / class giá trị tùy ý thay vì token`, page: h.file });

  const order: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };
  const sorted = issues.sort((a, b) => order[a.severity] - order[b.severity] || (a.page ?? '').localeCompare(b.page ?? ''));
  const report: QaReport = {
    createdAt: new Date().toISOString(),
    pages,
    screenshots,
    roles,
    issues: sorted.map((x, i) => ({ ...x, id: `Q-${String(i + 1).padStart(3, '0')}` })),
  };
  await fs.writeFile(path.join(target, QA_JSON), JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(path.join(target, QA_MD), renderQaMd(report), 'utf8');
  return report;
}

export const qaSummary = (r: QaReport) => ({
  createdAt: r.createdAt,
  critical: r.issues.filter((i) => i.severity === 'critical').length,
  major: r.issues.filter((i) => i.severity === 'major').length,
  minor: r.issues.filter((i) => i.severity === 'minor').length,
  screenshots: r.screenshots.length,
});

function renderQaMd(r: QaReport): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const L = [
    '# Báo cáo QA prototype',
    '',
    `> Tool kiểm tự động bằng Playwright lúc ${new Date(r.createdAt).toLocaleString('vi-VN')}: ${r.pages.length} trang × 3 kích thước (375 / 768 / 1440px), đo độ phủ bề ngang ở 1920px.`,
    '',
    '| Mức | Số lỗi |',
    '|---|---|',
    ...(['critical', 'major', 'minor'] as Severity[]).map((s) => `| ${SEVERITY_LABELS[s]} | ${r.issues.filter((i) => i.severity === s).length} |`),
    '',
    '## Lỗi',
    '',
  ];
  if (!r.issues.length) L.push('Không phát hiện lỗi.', '');
  else {
    L.push('| Mã | Mức | Nhóm | Trang | Kích thước | Mô tả |', '|---|---|---|---|---|---|');
    for (const i of r.issues) L.push(`| ${i.id} | ${SEVERITY_LABELS[i.severity]} | ${i.category} | ${i.page ?? '—'} | ${i.viewport ?? '—'} | ${esc(i.message)} |`);
    L.push('');
  }
  if (r.roles.length) {
    L.push('## Kiểm tra theo vai trò', '', '| Vai trò | Màn hình mặc định | Số mục menu | Mục không được phép | Trang cấm hiện "Không có quyền" |', '|---|---|---|---|---|');
    for (const x of r.roles)
      L.push(`| ${x.name} | ${x.home ?? '—'} | ${x.menu.length} | ${x.forbiddenInMenu.join(', ') || 'Không'} | ${x.noPermissionPage ? (x.noPermissionPage.ok ? 'Đúng' : `Sai (${x.noPermissionPage.path})`) : '—'} |`);
    L.push('');
  }
  L.push('## Ảnh chụp', '', '| Trang | Mobile 375 | Tablet 768 | Desktop 1440 |', '|---|---|---|---|');
  for (const p of r.pages) {
    const cell = (vp: string) => {
      const s = r.screenshots.find((x) => x.page === p && x.viewport === vp);
      return s ? `[ảnh](${s.file})` : '—';
    };
    L.push(`| ${p} | ${cell('mobile')} | ${cell('tablet')} | ${cell('desktop')} |`);
  }
  L.push('');
  return L.join('\n');
}

// ---------- HANDOFF.md ----------

/** Tên component gợi ý khi chuyển sang React / Vue */
const COMPONENT_NAMES: Record<string, string> = {
  button: 'Button', iconButton: 'IconButton', badge: 'Badge', statusBadge: 'StatusBadge', avatar: 'Avatar', tag: 'Tag', card: 'Card',
  pageHeader: 'PageHeader', descriptionList: 'DescriptionList', emptyState: 'EmptyState', skeleton: 'Skeleton', alert: 'Alert',
  table: 'DataTable', field: 'FormField', fieldGroup: 'FieldGroup', lineItems: 'LineItemsTable', validate: 'useFormValidation (hook)',
  tabs: 'Tabs', detailHeader: 'DetailHeader', timeline: 'Timeline', approvalFlow: 'ApprovalFlow', kpiCard: 'KpiCard',
  'chart.bar': 'BarChart', 'chart.line': 'LineChart', 'chart.donut': 'DonutChart', kanban: 'KanbanBoard', modal: 'Modal',
  drawer: 'Drawer', confirm: 'useConfirm (hook) + ConfirmDialog', toast: 'useToast (hook) + Toaster', tooltip: 'Tooltip', noPermission: 'NoPermission',
};
const pascal = (s: string) => s.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');

async function writeHandoff(o: Ctx & { srs: string; appName: string; pages: string[]; browser: Browser; roleNames: Map<string, string> }) {
  const { target, registry: R, pages } = o;
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const L: string[] = [
    `# HANDOFF — ${o.appName}`,
    '',
    '> Tài liệu bàn giao prototype cho đội frontend. **Tool sinh tự động** từ SRS + prototype — dựng lại prototype hoặc chạy QA để cập nhật.',
    '',
    '## 1. Chạy prototype',
    '',
    '- Mở `index.html` bằng trình duyệt (chạy được qua `file://`), hoặc dùng một static server bất kỳ.',
    '- `components.html`: style guide — tokens, icon, toàn bộ component kèm HTML mẫu.',
    '- Dữ liệu giả, xử lý giả, lưu trong `localStorage` của trình duyệt; "Đặt lại dữ liệu demo" ở menu người dùng.',
    '',
  ];

  // Bảng trang
  const frById = new Map((R?.functional ?? []).map((f) => [f.id, f.summary]));
  L.push('## 2. Trang ↔ màn hình (SCR) ↔ yêu cầu (FR) ↔ vai trò', '', '| Trang | Mã SCR | Màn hình | FR | Vai trò được xem |', '|---|---|---|---|---|');
  for (const p of pages) {
    const s = o.screens.find((x) => x.path === p);
    const reg = R?.screens.find((x) => x.id === s?.id);
    const fr = (reg?.functional ?? []).map((id) => `${id}${frById.get(id) ? ` (${esc(frById.get(id)!)})` : ''}`).join('; ');
    const roles = (s?.roles ?? []).map((r) => o.roleNames.get(r) ?? r).join(', ');
    const label = p === 'index.html' ? 'Đăng nhập / chọn vai trò' : p === 'components.html' ? 'Style guide' : s?.name ?? '—';
    L.push(`| \`${p}\` | ${s?.id ?? '—'} | ${esc(label)} | ${fr || '—'} | ${roles || (s ? 'Mọi vai trò' : '—')} |`);
  }
  L.push('');

  // Component
  const usage = new Map<string, Set<string>>();
  for (const p of pages) {
    if (p === 'components.html') continue;
    const text = await fs.readFile(path.join(target, p), 'utf8');
    for (const m of text.matchAll(/\bUI\.((?:chart|fmt)\.[a-zA-Z]+|[a-zA-Z]+)\s*\(/g)) {
      if (m[1].startsWith('fmt.')) continue;
      if (!usage.has(m[1])) usage.set(m[1], new Set());
      usage.get(m[1])!.add(p);
    }
  }
  L.push('## 3. Component', '', 'Định nghĩa trong `assets/js/components.js` (`window.UI`), demo đủ trạng thái trong `components.html`.', '');
  L.push('| Component (`UI.*`) | Gợi ý tên khi chuyển framework | Số trang dùng | Ví dụ trang |', '|---|---|---|---|');
  for (const [name, set] of [...usage.entries()].sort((a, b) => b[1].size - a[1].size)) {
    L.push(`| \`UI.${name}\` | ${COMPONENT_NAMES[name] ?? pascal(name)} | ${set.size} | ${[...set].slice(0, 3).map((x) => `\`${x}\``).join(', ')} |`);
  }
  if (!usage.size) L.push('| — | — | 0 | — |');
  L.push('', 'Định dạng số / ngày / tiền: `UI.fmt.*` → chuyển thành module tiện ích (`formatMoney`, `formatDate`…).', '');

  // Tokens
  L.push('## 4. Design tokens', '');
  const tokFile = path.join(o.srs, TOKENS_FILE);
  const tok = existsSync(tokFile) ? DesignTokensSchema.safeParse(JSON.parse(await fs.readFile(tokFile, 'utf8'))) : null;
  L.push(
    '- Nguồn: `srs/_design-tokens.json` (SRS 9.2–9.5). Trong prototype: `assets/js/tailwind.tokens.js` (cấu hình Tailwind) và `assets/css/tokens.css` (CSS variables).',
    '- Dùng lại khi làm thật: chép `theme` trong `tailwind.tokens.js` vào `tailwind.config`, chép `tokens.css` vào CSS gốc. Màu dạng `rgb(var(--c-primary-600) / <alpha-value>)` nên dùng được độ trong suốt và chế độ tối.',
    '- Bảng màu **chỉ gồm token**: `primary`, `neutral`, `success`, `warning`, `danger`, `info` — không dùng màu Tailwind mặc định.',
  );
  if (tok?.success) {
    const t = tok.data;
    L.push(
      `- Mật độ: \`${t.density}\` · Font: \`${t.fontFamily.sans}\``,
      `- Cỡ chữ: ${Object.entries(t.fontSize).map(([k, [s, lh]]) => `\`text-${k}\` ${s}/${lh}`).join(', ')}`,
      `- Bo góc: ${Object.entries(t.radius).map(([k, v]) => `\`rounded-${k}\` ${v}`).join(', ')}`,
      `- Breakpoint: ${Object.entries(t.breakpoints).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}`,
      `- Kích thước khung: ${Object.entries(t.layout).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}`,
    );
  }
  L.push('');

  // Runtime
  L.push(
    '## 5. Phân quyền, vòng đời chứng từ, dữ liệu demo',
    '',
    '| File (tool sinh từ SRS) | Vai trò trong prototype | Khi làm thật |',
    '|---|---|---|',
    '| `assets/js/permissions.js` | Vai trò, ma trận quyền (`SALES.ORDER.APPROVE`…), phạm vi dữ liệu, màn hình mặc định; ẩn phần tử `data-permission` | Quyền lấy từ API đăng nhập; giữ nguyên mã quyền và cơ chế `can(code)`; **phải kiểm quyền lại ở backend** |',
    '| `assets/js/workflows.js` | Trạng thái + chuyển trạng thái chứng từ đúng 5.6, lịch sử, cấp mã | Backend thực hiện chuyển trạng thái; frontend chỉ hiển thị nút theo danh sách hành động backend trả về |',
    '| `assets/js/demo-store.js` | Lưu thay đổi demo vào `localStorage` | Thay bằng lớp gọi API (cùng tên thao tác: list / get / insert / update / remove) |',
    '',
  );

  // Mock data
  L.push('## 6. Dữ liệu giả → gợi ý cấu trúc API', '');
  const mockDir = path.join(target, 'assets/js/mock-data');
  if (existsSync(mockDir)) {
    const files = (await fs.readdir(mockDir)).filter((f) => f.endsWith('.js')).sort((a, b) => (a === 'master.js' ? -1 : b === 'master.js' ? 1 : a.localeCompare(b)));
    const page = await o.browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>');
    for (const f of files) await page.addScriptTag({ path: path.join(mockDir, f) }).catch(() => {});
    // Viết dạng chuỗi: hàm lồng nhau qua tsx/esbuild bị chèn helper __name không có trong trình duyệt
    const shape = (await page.evaluate(`(() => {
      var M = window.MOCK || {};
      function typeOf(v) {
        if (v === null || v === undefined) return 'null';
        if (Array.isArray(v)) return v.length && typeof v[0] === 'object' ? 'object[]' : (v.length ? typeof v[0] : 'any') + '[]';
        if (typeof v === 'string' && /^\\d{4}-\\d{2}-\\d{2}/.test(v)) return 'date (ISO)';
        return typeof v;
      }
      return Object.keys(M).map(function (key) {
        var val = M[key];
        var rows = Array.isArray(val) ? val : [val];
        var first = rows[0] || {};
        return { key: key, count: rows.length, fields: Object.keys(first).map(function (k) { return k + ': ' + typeOf(first[k]); }) };
      });
    })()`)) as { key: string; count: number; fields: string[] }[];
    await page.close();
    if (shape.length) {
      L.push('| `MOCK.*` | Số bản ghi | Trường (kiểu suy ra từ bản ghi đầu) | Gợi ý endpoint |', '|---|---|---|---|');
      for (const s of shape) {
        const ep = `/api/${s.key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
        L.push(`| \`${s.key}\` | ${s.count} | ${esc(s.fields.join(', ')).slice(0, 600)} | \`GET ${ep}\`, \`GET ${ep}/:id\` |`);
      }
    } else L.push('Chưa đọc được `window.MOCK` từ `assets/js/mock-data/*.js`.');
  } else L.push('Chưa có `assets/js/mock-data/`.');
  L.push('');

  // CẦN XÁC NHẬN ở Phần 9
  L.push('## 7. Điểm còn [CẦN XÁC NHẬN] ảnh hưởng giao diện', '');
  const uiDir = path.join(o.srs, '09-ui-ux');
  const pending: string[] = [];
  const walk = async (dir: string) => {
    if (!existsSync(dir)) return;
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.endsWith('.md')) {
        const lines = (await fs.readFile(full, 'utf8')).split('\n');
        lines.forEach((l, i) => {
          if (l.includes('[CẦN XÁC NHẬN]')) pending.push(`| \`${path.relative(o.srs, full).split(path.sep).join('/')}\` | ${i + 1} | ${esc(l.trim()).slice(0, 220)} |`);
        });
      }
    }
  };
  await walk(uiDir);
  if (pending.length) L.push('| File SRS | Dòng | Nội dung |', '|---|---|---|', ...pending);
  else L.push('Không còn điểm nào trong Phần 9.');
  L.push('');
  await fs.writeFile(path.join(target, 'HANDOFF.md'), L.join('\n'), 'utf8');
}
