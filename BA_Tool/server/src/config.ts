// Cấu hình chung: đường dẫn gốc, biến môi trường, model.
// Xác thực: tool dùng phiên đăng nhập Claude Code (tài khoản Claude của chính người dùng),
// KHÔNG dùng API key. Xem auth.ts.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Thư mục gốc của tool (chứa .claude/skills/srs-builder). */
export const ROOT_DIR = path.resolve(here, '..', '..');
/** Nơi lưu các dự án: workspace/<slug>/ */
export const WORKSPACE_DIR = path.join(ROOT_DIR, 'workspace');

// .env chỉ còn dùng cho các tùy chọn (model, cổng...) — không bắt buộc phải có.
dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

export const PORT = Number(process.env.PORT || 8787);
export const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

/** Skill thẩm mỹ bắt buộc khi dựng prototype ("taste-skill"). */
export const TASTE_SKILL = process.env.TASTE_SKILL || 'design-taste-frontend';

/** Môi trường có biến ANTHROPIC_API_KEY không — nếu có, SDK có thể dùng API key thay vì tài khoản Claude. */
export function envHasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
