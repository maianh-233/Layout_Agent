// Design tokens (srs/_design-tokens.json) — bản máy đọc được của 9.2–9.5.
// Prototype sinh tailwind.tokens.js / tokens.css từ file này nên phải đúng định dạng.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Mã màu HEX 6 chữ số, ví dụ #3366FF');
const scale = (keys: string[]) => z.object(Object.fromEntries(keys.map((k) => [k, hex]))).passthrough();
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
const SEMANTIC = ['50', '100', '500', '600', '700'];
const size = z.string().regex(/^\d+(\.\d+)?(px|rem)$/, 'Kích thước dạng 14px hoặc 0.875rem');

const ColorsSchema = z.object({
  primary: scale(SHADES),
  neutral: scale(['0', ...SHADES]),
  success: scale(SEMANTIC),
  warning: scale(SEMANTIC),
  danger: scale(SEMANTIC),
  info: scale(SEMANTIC),
});

export const DesignTokensSchema = z.object({
  density: z.enum(['compact', 'comfortable']),
  colors: ColorsSchema.passthrough(),
  fontFamily: z.object({ sans: z.string().min(1), mono: z.string().optional() }).passthrough(),
  fontSize: z.record(z.string(), z.tuple([size, size])).refine((m) => ['xs', 'sm', 'base', 'lg', 'xl', '2xl'].every((k) => k in m), {
    message: 'fontSize cần đủ xs, sm, base, lg, xl, 2xl',
  }),
  radius: z.record(z.string(), z.string()).refine((m) => ['sm', 'md', 'lg'].every((k) => k in m), { message: 'radius cần đủ sm, md, lg' }),
  shadow: z.record(z.string(), z.string()).refine((m) => ['sm', 'md', 'lg'].every((k) => k in m), { message: 'shadow cần đủ sm, md, lg' }),
  breakpoints: z.object({ sm: size, md: size, lg: size, xl: size }).passthrough(),
  layout: z.record(z.string(), size).default({}),
  googleFonts: z.array(z.string()).default([]),
  dark: z.object({ colors: z.record(z.string(), z.unknown()) }).optional(),
  proposed: z.boolean().optional(),
});
export type DesignTokens = z.infer<typeof DesignTokensSchema>;

export const TOKENS_FILE = '_design-tokens.json';

/** Lỗi định dạng của srs/_design-tokens.json (mảng rỗng = hợp lệ). */
export async function checkDesignTokens(srs: string): Promise<string[]> {
  const file = path.join(srs, TOKENS_FILE);
  if (!existsSync(file)) return [`Thiếu file srs/${TOKENS_FILE} (design tokens — xem references/design-guide.md mục 1)`];
  let raw: unknown;
  try {
    const text = (await fs.readFile(file, 'utf8')).replace(/^﻿/, '').trim();
    raw = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
  } catch (e) {
    return [`${TOKENS_FILE} không phải JSON hợp lệ: ${(e as Error).message}`];
  }
  const r = DesignTokensSchema.safeParse(raw);
  return r.success ? [] : r.error.issues.slice(0, 20).map((i) => `${TOKENS_FILE} › ${i.path.join('.') || '(gốc)'}: ${i.message}`);
}
