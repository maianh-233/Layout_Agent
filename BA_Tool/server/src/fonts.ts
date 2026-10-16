// Kiểm tra font có hiển thị đúng ngôn ngữ của website không — bằng dữ liệu thật của Google Fonts,
// không đoán: tải CSS của font (UA trình duyệt hiện đại → có unicode-range từng subset) rồi xem một ký tự
// đặc trưng của ngôn ngữ có nằm trong unicode-range nào không. Kết quả ghi vào concept.md để AI chọn fallback.
import type { Language } from './presets.js';

/** Ký tự đặc trưng: ệ (tiếng Việt), 中 (Hán), あ (kana) */
const SAMPLE: Record<Language, number> = { en: 0x0041, vi: 0x1ec7, zh: 0x4e2d, ja: 0x3042 };

/** Font dự phòng có trên Google Fonts, chắc chắn đủ ký tự của ngôn ngữ */
export const FALLBACK_FONTS: Record<Language, { sans: string; serif: string; system: string }> = {
  en: { sans: 'Inter', serif: 'Source Serif 4', system: 'system-ui, sans-serif' },
  vi: { sans: 'Be Vietnam Pro', serif: 'Noto Serif', system: 'system-ui, "Segoe UI", Roboto, Arial, sans-serif' },
  zh: { sans: 'Noto Sans SC', serif: 'Noto Serif SC', system: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif' },
  ja: { sans: 'Noto Sans JP', serif: 'Noto Serif JP', system: '"Hiragino Sans", "Yu Gothic", Meiryo, "Noto Sans CJK JP", sans-serif' },
};

export interface FontCheck {
  family: string;
  /** Có trên Google Fonts không (null = không kiểm tra được, ví dụ mất mạng) */
  onGoogleFonts: boolean | null;
  /** Có ký tự của ngôn ngữ không (null = không xác định) */
  supports: boolean | null;
  note?: string;
}

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

/** "Shippori Mincho:wght@500;700" → "Shippori Mincho"; bỏ dấu nháy, khoảng trắng thừa */
export const familyName = (spec: string) => spec.split(':')[0].replace(/["']/g, '').replace(/\s+/g, ' ').trim();

function covers(css: string, cp: number): boolean {
  for (const m of css.matchAll(/unicode-range:\s*([^;]+);/gi)) {
    for (const part of m[1].split(',')) {
      const r = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(part.trim());
      if (!r) continue;
      const lo = parseInt(r[1].replace(/\?/g, '0'), 16);
      const hi = r[2] ? parseInt(r[2], 16) : r[1].includes('?') ? parseInt(r[1].replace(/\?/g, 'f'), 16) : lo;
      if (cp >= lo && cp <= hi) return true;
    }
  }
  return false;
}

export async function checkFont(spec: string, lang: Language): Promise<FontCheck> {
  const family = familyName(spec);
  if (!family) return { family, onGoogleFonts: null, supports: null };
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
    const res = await fetch(url, { headers: { 'User-Agent': CHROME_UA }, signal: AbortSignal.timeout(8000) });
    if (res.status === 400 || res.status === 404) return { family, onGoogleFonts: false, supports: null, note: 'không có trên Google Fonts' };
    if (!res.ok) return { family, onGoogleFonts: null, supports: null, note: `Google Fonts trả về ${res.status}` };
    const css = await res.text();
    // Font không chia subset (một file duy nhất) → không có unicode-range, không kết luận được
    if (!/unicode-range/i.test(css)) return { family, onGoogleFonts: true, supports: null, note: 'không có thông tin unicode-range' };
    return { family, onGoogleFonts: true, supports: covers(css, SAMPLE[lang]) };
  } catch (e) {
    return { family, onGoogleFonts: null, supports: null, note: `không kiểm tra được (${(e as Error).name === 'TimeoutError' ? 'quá thời gian' : 'lỗi mạng'})` };
  }
}

export const checkFonts = (specs: string[], lang: Language) => Promise.all([...new Set(specs.map(familyName).filter(Boolean))].map((f) => checkFont(f, lang)));
