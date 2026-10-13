// Nền móng prototype do code sinh (không để AI viết tay, để luôn khớp SRS):
//   assets/js/tailwind.tokens.js — tailwind.config từ srs/_design-tokens.json (bảng màu chỉ gồm token)
//   assets/css/tokens.css        — cùng token dạng CSS variables + font + style nền
//   assets/js/icons.js           — sprite icon SVG (Lucide, ISC) chèn vào trang, dùng được cả khi mở file://
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DesignTokensSchema, TOKENS_FILE, type DesignTokens } from './design.js';

const HEADER = (src: string) => `/* Sinh tự động bởi SRS & Prototype Builder từ ${src} — không sửa tay. Sửa SRS rồi dựng lại prototype. */\n`;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
/** sidebarWidth → sidebar, tableRowHeight → table-row, contentMaxWidth → content */
const layoutKey = (k: string) => kebab(k.replace(/(MaxWidth|Width|Height)$/, '')) || kebab(k);

type Palette = Record<string, Record<string, string>>;
const palettes = (t: DesignTokens) => t.colors as unknown as Palette;

export function renderTokensCss(t: DesignTokens): string {
  const L: string[] = [HEADER(`srs/${TOKENS_FILE}`)];
  if (t.googleFonts.length) {
    const fam = t.googleFonts
      .map((f) => {
        const [name, weights] = f.split(':');
        const w = (weights ?? '400,500,600,700').split(',').map((x) => x.trim()).join(';');
        return `family=${name.trim().replace(/ /g, '+')}:wght@${w}`;
      })
      .join('&');
    L.push(`@import url('https://fonts.googleapis.com/css2?${fam}&display=swap');`, '');
  }
  const vars = (p: Palette) =>
    Object.entries(p).flatMap(([name, scale]) => (typeof scale === 'object' ? Object.entries(scale).map(([k, v]) => `  --c-${name}-${k}: ${rgb(v)}; /* ${v} */`) : []));
  L.push(':root {', ...vars(palettes(t)));
  L.push(`  --font-sans: ${t.fontFamily.sans};`);
  if (t.fontFamily.mono) L.push(`  --font-mono: ${t.fontFamily.mono};`);
  for (const [k, [size, lh]] of Object.entries(t.fontSize)) L.push(`  --text-${k}: ${size};`, `  --leading-${k}: ${lh};`);
  for (const [k, v] of Object.entries(t.radius)) L.push(`  --radius-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.shadow)) L.push(`  --shadow-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.layout)) L.push(`  --layout-${layoutKey(k)}: ${v};`);
  L.push(`  --density: ${t.density};`, '}', '');
  if (t.dark) L.push('[data-theme="dark"] {', ...vars(t.dark.colors as Palette), '}', '');
  L.push(
    'html { font-family: var(--font-sans); color: rgb(var(--c-neutral-800)); background: rgb(var(--c-neutral-50)); -webkit-font-smoothing: antialiased; }',
    '.icon { width: 1.25em; height: 1.25em; flex-shrink: 0; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }',
    ':focus-visible { outline: 2px solid rgb(var(--c-primary-500)); outline-offset: 2px; }',
    '.tabular-nums, td.num, th.num { font-variant-numeric: tabular-nums; }',
    '',
  );
  return L.join('\n');
}

export function renderTailwindTokens(t: DesignTokens): string {
  const color = (name: string, keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, `rgb(var(--c-${name}-${k}) / <alpha-value>)`]));
  const colors: Record<string, unknown> = { transparent: 'transparent', current: 'currentColor', inherit: 'inherit' };
  for (const [name, scale] of Object.entries(palettes(t))) if (typeof scale === 'object') colors[name] = color(name, Object.keys(scale));
  // Tiện dùng: white / black trỏ về neutral
  colors.white = 'rgb(var(--c-neutral-0) / <alpha-value>)';
  colors.black = 'rgb(var(--c-neutral-900) / <alpha-value>)';

  const config = {
    theme: {
      colors,
      fontFamily: { sans: ['var(--font-sans)'], mono: ['var(--font-mono, ui-monospace, monospace)'] },
      fontSize: Object.fromEntries(Object.keys(t.fontSize).map((k) => [k, [`var(--text-${k})`, { lineHeight: `var(--leading-${k})` }]])),
      borderRadius: { none: '0', ...Object.fromEntries(Object.keys(t.radius).map((k) => [k, `var(--radius-${k})`])), DEFAULT: 'var(--radius-md)' },
      boxShadow: { none: 'none', ...Object.fromEntries(Object.keys(t.shadow).map((k) => [k, `var(--shadow-${k})`])), DEFAULT: 'var(--shadow-sm)' },
      screens: Object.fromEntries(Object.entries(t.breakpoints)),
      extend: {
        spacing: Object.fromEntries(Object.keys(t.layout).map((k) => [layoutKey(k), `var(--layout-${layoutKey(k)})`])),
      },
    },
  };
  return (
    HEADER(`srs/${TOKENS_FILE}`) +
    '// Nạp NGAY SAU <script src="https://cdn.tailwindcss.com"></script>.\n' +
    '// Bảng màu chỉ gồm token: primary, neutral, success, warning, danger, info (không có blue-500, gray-200…).\n' +
    `tailwind.config = ${JSON.stringify(config, null, 2)};\n`
  );
}

// ---------- Icon ----------

/** Bộ icon cho hệ thống quản trị / website. Tên = tên file trong lucide-static (bỏ qua tên không có). */
export const ICON_SET = [
  'house', 'layout-dashboard', 'layout-grid', 'list', 'menu', 'panel-left-close', 'panel-left-open', 'columns-3', 'square-kanban',
  'users', 'user', 'user-plus', 'user-check', 'user-cog', 'contact', 'building-2', 'briefcase', 'factory', 'warehouse', 'store',
  'shopping-cart', 'shopping-bag', 'package', 'package-check', 'package-plus', 'boxes', 'truck', 'barcode', 'scan-barcode',
  'receipt', 'receipt-text', 'file-text', 'file-plus', 'file-check', 'files', 'clipboard-list', 'clipboard-check', 'notebook-pen',
  'wallet', 'credit-card', 'banknote', 'landmark', 'coins', 'percent', 'calculator', 'hand-coins',
  'chart-column', 'chart-line', 'chart-pie', 'trending-up', 'trending-down', 'target', 'gauge',
  'settings', 'sliders-horizontal', 'shield', 'shield-check', 'lock', 'key-round', 'log-in', 'log-out', 'repeat',
  'bell', 'mail', 'phone', 'message-square', 'send', 'inbox', 'calendar', 'calendar-days', 'clock', 'history',
  'search', 'funnel', 'arrow-up-down', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
  'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right', 'chevrons-left', 'chevrons-right',
  'plus', 'minus', 'x', 'check', 'circle-check', 'circle-x', 'triangle-alert', 'circle-alert', 'info', 'circle-help', 'ban',
  'ellipsis', 'ellipsis-vertical', 'pencil', 'trash-2', 'copy', 'download', 'upload', 'printer', 'eye', 'eye-off',
  'external-link', 'link', 'paperclip', 'image', 'refresh-cw', 'rotate-ccw', 'save', 'share-2', 'star', 'tag', 'tags',
  'map-pin', 'globe', 'sun', 'moon', 'heart', 'thumbs-up', 'thumbs-down', 'circle-dot', 'loader-circle', 'grip-vertical',
  'hammer', 'wrench', 'cake', 'utensils', 'graduation-cap', 'stethoscope', 'car', 'hotel',
];

let iconsCache: string | null = null;

export async function renderIconsJs(): Promise<string> {
  if (iconsCache) return iconsCache;
  const require = createRequire(import.meta.url);
  const dir = path.join(path.dirname(require.resolve('lucide-static/package.json')), 'icons');
  const symbols: string[] = [];
  const names: string[] = [];
  for (const name of ICON_SET) {
    const file = path.join(dir, `${name}.svg`);
    if (!existsSync(file)) continue;
    const svg = await fs.readFile(file, 'utf8');
    const inner = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(svg)?.[1].replace(/\s*\n\s*/g, '') ?? '';
    symbols.push(`<symbol id="i-${name}" viewBox="0 0 24 24">${inner}</symbol>`);
    names.push(name);
  }
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" id="icon-sprite" style="display:none">${symbols.join('')}</svg>`;
  iconsCache =
    HEADER('lucide-static (ISC)') +
    `// Dùng: <svg class="icon"><use href="#i-house"></use></svg> hoặc window.icon('house', 'size-4').\n` +
    `(function () {\n` +
    `  var SPRITE = ${JSON.stringify(sprite)};\n` +
    `  window.ICONS = ${JSON.stringify(names)};\n` +
    `  window.icon = function (name, cls) {\n` +
    `    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';\n` +
    `  };\n` +
    `  function inject() {\n` +
    `    if (document.getElementById('icon-sprite')) return;\n` +
    `    var d = document.createElement('div');\n` +
    `    d.innerHTML = SPRITE;\n` +
    `    document.body.insertBefore(d.firstChild, document.body.firstChild);\n` +
    `  }\n` +
    `  if (document.body) inject(); else document.addEventListener('DOMContentLoaded', inject);\n` +
    `})();\n`;
  return iconsCache;
}

// ---------- Ghi vào folder prototype ----------

/** Ghi file nền móng vào TARGET_DIR. Lỗi tokens → ném lỗi rõ ràng (sửa ở tab Rà soát rồi dựng lại). */
export async function writeFoundation(target: string, srs: string): Promise<string[]> {
  const file = path.join(srs, TOKENS_FILE);
  if (!existsSync(file)) throw new Error(`Chưa có srs/${TOKENS_FILE}. Hãy hoàn tất bước Giao diện (hoặc chạy lại bước đó) trước khi dựng prototype.`);
  const parsed = DesignTokensSchema.safeParse(JSON.parse((await fs.readFile(file, 'utf8')).replace(/^﻿/, '')));
  if (!parsed.success) {
    throw new Error(`srs/${TOKENS_FILE} chưa hợp lệ (${parsed.error.issues[0]?.message}). Mở tab Rà soát, để AI sửa lỗi design tokens rồi dựng lại.`);
  }
  const files: [string, string][] = [
    ['assets/js/tailwind.tokens.js', renderTailwindTokens(parsed.data)],
    ['assets/css/tokens.css', renderTokensCss(parsed.data)],
    ['assets/js/icons.js', await renderIconsJs()],
  ];
  for (const [rel, content] of files) {
    await fs.mkdir(path.dirname(path.join(target, rel)), { recursive: true });
    await fs.writeFile(path.join(target, rel), content, 'utf8');
  }
  return files.map(([rel]) => rel);
}

/** Mọi trang HTML trong prototype (đường dẫn tương đối, dùng '/'), bỏ thư mục assets. index / components lên đầu. */
export async function listPages(target: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(target, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (!['assets', 'node_modules', '.git'].includes(e.name) && !e.name.startsWith('_')) await walk(full);
      } else if (e.name.toLowerCase().endsWith('.html')) out.push(rel);
    }
  };
  await walk(target);
  const rank = (p: string) => (p === 'index.html' ? 0 : p === 'components.html' ? 1 : p.includes('/') ? 3 : 2);
  return out.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'vi', { numeric: true }));
}

/** Đếm chỗ hardcode giá trị thiết kế trong trang (mã màu HEX, class Tailwind giá trị tùy ý như text-[13px]). */
export async function scanHardcoded(target: string, pages: string[]): Promise<{ file: string; count: number }[]> {
  const out: { file: string; count: number }[] = [];
  const extra = existsSync(path.join(target, 'assets/js/components.js')) ? ['assets/js/components.js', 'assets/js/layout.js'] : [];
  for (const rel of [...pages, ...extra]) {
    const full = path.join(target, rel);
    if (!existsSync(full)) continue;
    const text = await fs.readFile(full, 'utf8');
    const hex = text.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F-])/g)?.filter((m) => !/^#i-/.test(m)) ?? [];
    const arbitrary = text.match(/\b[a-z-]+-\[[^\]\s]+\]/g) ?? [];
    const count = hex.length + arbitrary.length;
    if (count) out.push({ file: rel, count });
  }
  return out;
}
