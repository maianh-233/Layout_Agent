// Cho AI "nhìn" trang mình vừa dựng (MCP chạy trong tool, dùng Chromium của Playwright):
//   view_page(page, width, section?, full?) — chụp ảnh trang để AI tự đánh giá thẩm mỹ rồi sửa
//   check_page(page)                         — kiểm nhanh bằng code: lỗi JS, file hỏng, tràn ngang, ảnh hỏng, chữ quá nhỏ
// Mở qua file:// đúng như khách mở; tắt chuyển động (reduced motion) để nội dung data-reveal hiện đủ khi chụp.
import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import type { Browser, Page } from 'playwright';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const PREVIEW_TOOLS = ['mcp__preview__view_page', 'mcp__preview__check_page'];

/** Ảnh cắt theo từng đoạn để AI đọc rõ mà không tốn quá nhiều token */
const MAX_TILES = 8;
const isExternal = (url: string) => /^https?:/i.test(url);
const text = (t: string) => ({ type: 'text' as const, text: t });

export function previewServer(target: string, log: (t: string) => void) {
  let browser: Browser | null = null;
  const getBrowser = async () => {
    if (browser) return browser;
    const { chromium } = await import('playwright');
    try {
      browser = await chromium.launch();
    } catch (e) {
      throw new Error(`Không mở được Chromium của Playwright ("npx playwright install chromium" trong thư mục server). ${(e as Error).message.split('\n')[0]}`);
    }
    return browser;
  };

  const resolvePage = (page: string) => {
    const rel = page.replace(/^[/\\]+/, '') || 'index.html';
    const full = path.resolve(target, rel);
    if (!full.startsWith(path.resolve(target)) || !existsSync(full)) throw new Error(`Không có trang "${rel}" trong TARGET_DIR.`);
    return { rel, url: pathToFileURL(full).href };
  };

  /** Mở trang, gom lỗi; ảnh lazy được ép tải ngay để ảnh chụp đầy đủ. */
  const open = async (url: string, width: number, height: number, scale = 1) => {
    const b = await getBrowser();
    const context = await b.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    const failed: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && !/favicon|Failed to load resource/i.test(m.text())) errors.push(m.text().slice(0, 200));
      // motion.js / atmos.js bỏ qua phần tử lỗi để trang vẫn chạy, nhưng vẫn phải báo để sửa
      else if (m.type() === 'warning' && /^\[(motion|atmos)\]/.test(m.text())) errors.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
    page.on('requestfailed', (r) => {
      if (!isExternal(r.url())) failed.push(decodeURIComponent(r.url().replace(/^file:\/\/\/?/, '')));
    });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => ((i as HTMLImageElement).loading = 'eager')));
    await page.waitForTimeout(900); // Tailwind CDN + ảnh
    return { page, close: () => context.close(), errors, failed };
  };

  interface Diagnosis {
    docWidth: number;
    W: number;
    height: number;
    overflow: string[];
    broken: string[];
    tiny: number;
    deadLinks: number;
    sections: string[];
  }
  // Chuỗi script (không phải hàm TS): tsx chèn helper __name vào hàm lồng nhau, trình duyệt không có helper đó
  const DIAGNOSE = `(() => {
      const W = document.documentElement.clientWidth;
      const describe = (el) => {
        const id = el.id ? \`#\${el.id}\` : '';
        const cls = typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
        const section = el.closest('section[id],header,footer,section');
        const where = section && section !== el ? \` trong \${section.tagName.toLowerCase()}\${section.id ? '#' + section.id : ''}\` : '';
        return \`<\${el.tagName.toLowerCase()}\${id}\${cls === '.' ? '' : cls}>\${where}\`;
      };
      const overflow = [];
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.right <= W + 1) continue;
        if (getComputedStyle(el).position === 'fixed') continue;
        // Bỏ qua phần tử nằm trong vùng cuộn ngang có chủ đích (băng chuyền, marquee)
        let p = el.parentElement;
        let clipped = false;
        while (p && p !== document.body) {
          const ov = getComputedStyle(p).overflowX;
          if (ov !== 'visible') {
            clipped = true;
            break;
          }
          p = p.parentElement;
        }
        if (!clipped) overflow.push(\`\${describe(el)} rộng tới \${Math.round(r.right)}px\`);
        if (overflow.length >= 5) break;
      }
      const broken = Array.from(document.images)
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.getAttribute('src') || '(không src)')
        .slice(0, 5);
      let tiny = 0;
      for (const el of Array.from(document.body.querySelectorAll('p,li,a,span,button,label,td'))) {
        const r = el.getBoundingClientRect();
        if (!r.width || !el.textContent?.trim()) continue;
        if (parseFloat(getComputedStyle(el).fontSize) < 12) tiny++;
      }
      const deadLinks = Array.from(document.querySelectorAll('a[href]')).filter((a) => {
        const h = a.getAttribute('href');
        return h === '#' || (h.startsWith('#') && h.length > 1 && !document.getElementById(decodeURIComponent(h.slice(1))));
      }).length;
      return {
        docWidth: document.documentElement.scrollWidth,
        W,
        height: document.documentElement.scrollHeight,
        overflow,
        broken,
        tiny,
        deadLinks,
        sections: Array.from(document.querySelectorAll('body > header, main > section, body > section, section[id], body > footer, main > footer'))
          .map((s) => \`\${s.tagName.toLowerCase()}\${s.id ? '#' + s.id : ''}\`)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 20),
      };
    })()`;
  const diagnose = (page: Page) => page.evaluate(DIAGNOSE) as Promise<Diagnosis>;

  const summarize = (d: Diagnosis, errors: string[], failed: string[]) => {
    const out: string[] = [];
    if (errors.length) out.push(`Lỗi JS (${errors.length}): ${errors.slice(0, 3).join(' | ')}`);
    if (failed.length) out.push(`File không tải được: ${[...new Set(failed)].slice(0, 5).join(', ')}`);
    if (d.docWidth > d.W + 1) out.push(`TRÀN NGANG: trang rộng ${d.docWidth}px > ${d.W}px. Phần tử gây tràn: ${d.overflow.join('; ') || '(không xác định)'}`);
    if (d.broken.length) out.push(`Ảnh hỏng: ${d.broken.join(', ')}`);
    if (d.tiny) out.push(`${d.tiny} đoạn chữ nhỏ hơn 12px`);
    if (d.deadLinks) out.push(`${d.deadLinks} link "#" hoặc trỏ tới id không tồn tại`);
    return out;
  };

  const server = createSdkMcpServer({
    name: 'preview',
    version: '1.0.0',
    alwaysLoad: true,
    instructions:
      'Xem trang đã dựng như khách thấy. Sau khi ghi index.html: check_page, rồi view_page toàn trang ở 1440 và 375 để tự đánh giá thẩm mỹ, sửa rồi xem lại đúng section vừa sửa.',
    tools: [
      tool(
        'view_page',
        'Chụp ảnh một trang trong TARGET_DIR (mở bằng file://, hiệu ứng hiện dần đã bật sẵn hết). ' +
          'full=true: cả trang, cắt thành nhiều ảnh theo thứ tự từ trên xuống (thu nhỏ ở desktop). section="#id" hoặc selector: chỉ chụp màn hình quanh khối đó (dùng khi xem lại sau khi sửa). ' +
          'Mặc định: màn hình đầu tiên (above the fold).',
        {
          page: z.string().optional().describe('Đường dẫn tương đối trong TARGET_DIR, mặc định index.html'),
          width: z.number().int().min(320).max(2560).optional().describe('Bề ngang màn hình: 375 (điện thoại), 768, 1440 (mặc định), 1920'),
          section: z.string().optional().describe('CSS selector của khối cần xem, ví dụ "#bang-gia"'),
          full: z.boolean().optional().describe('Chụp toàn trang'),
        },
        async ({ page: pageArg, width: w, section, full }) => {
          const width = w ?? 1440;
          const height = width < 600 ? 812 : width < 1100 ? 1024 : 900;
          const scale = full && width >= 1100 ? 0.5 : 1;
          let session: Awaited<ReturnType<typeof open>> | null = null;
          try {
            const { rel, url } = resolvePage(pageArg ?? 'index.html');
            session = await open(url, width, height, scale);
            const { page } = session;
            const d = await diagnose(page);
            const images: { type: 'image'; data: string; mimeType: string }[] = [];
            const shot = async (opts: Parameters<Page['screenshot']>[0]) =>
              images.push({ type: 'image', data: (await page.screenshot({ type: 'jpeg', quality: 70, ...opts })).toString('base64'), mimeType: 'image/jpeg' });
            let note = '';
            if (section) {
              const el = page.locator(section).first();
              if (!(await el.count())) return { content: [text(`Không tìm thấy "${section}". Các khối có trong trang: ${d.sections.join(', ')}`)] };
              await el.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              const box = await el.boundingBox();
              const scrollY = await page.evaluate(() => window.scrollY);
              if (box && box.height > height) {
                // Khối cao hơn màn hình → chụp nguyên khối (tối đa 2.5 màn hình)
                await shot({ fullPage: true, clip: { x: 0, y: box.y + scrollY, width, height: Math.min(box.height, height * 2.5) } });
              } else await shot({});
              note = `Khối ${section}`;
            } else if (full) {
              const tile = width < 600 ? 1400 : 1800;
              const total = Math.min(d.height, tile * MAX_TILES);
              for (let y = 0; y < total; y += tile) await shot({ fullPage: true, clip: { x: 0, y, width, height: Math.min(tile, total - y) } });
              note = `Toàn trang cao ${d.height}px, ${images.length} ảnh từ trên xuống${d.height > total ? ` (cắt bớt phần dưới ${total}px)` : ''}`;
            } else {
              await shot({});
              note = 'Màn hình đầu tiên';
            }
            const issues = summarize(d, session.errors, session.failed);
            log(`Xem trang ${rel} @${width}px${section ? ` ${section}` : full ? ' (toàn trang)' : ''}`);
            return {
              content: [
                text(
                  `${rel} @ ${width}px — ${note}. Các khối: ${d.sections.join(', ') || '(không có section)'}.\n` +
                    (issues.length ? `Vấn đề đo được:\n- ${issues.join('\n- ')}` : 'Không có lỗi đo được bằng code.'),
                ),
                ...images,
              ],
            };
          } catch (e) {
            return { content: [text(`Không xem được trang: ${(e as Error).message.split('\n')[0]}`)] };
          } finally {
            await session?.close();
          }
        },
      ),
      tool(
        'check_page',
        'Kiểm nhanh bằng code (không ảnh, rẻ): lỗi JS, file không tải được, tràn ngang ở 375 / 768 / 1440px kèm phần tử gây tràn, ảnh hỏng, chữ quá nhỏ, link chết.',
        { page: z.string().optional().describe('Đường dẫn tương đối trong TARGET_DIR, mặc định index.html') },
        async ({ page: pageArg }) => {
          try {
            const { rel, url } = resolvePage(pageArg ?? 'index.html');
            const lines: string[] = [];
            for (const width of [375, 768, 1440]) {
              const s = await open(url, width, 900);
              try {
                const issues = summarize(await diagnose(s.page), s.errors, s.failed);
                lines.push(`${width}px: ${issues.length ? '\n  - ' + issues.join('\n  - ') : 'ổn'}`);
              } finally {
                await s.close();
              }
            }
            log(`Kiểm trang ${rel} ở 375 / 768 / 1440px`);
            return { content: [text(`${rel}\n${lines.join('\n')}`)] };
          } catch (e) {
            return { content: [text(`Không kiểm được trang: ${(e as Error).message.split('\n')[0]}`)] };
          }
        },
      ),
    ],
  });

  return {
    server,
    close: async () => {
      await browser?.close().catch(() => {});
      browser = null;
    },
  };
}
