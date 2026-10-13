// Gọi skill srs-builder qua Claude Agent SDK.
// Dùng Agent SDK (không gọi Messages API trực tiếp) để Claude nạp được skill trong
// .claude/skills của tool và trong ~/.claude/skills (ví dụ design-taste-frontend).
import path from 'node:path';
import { query, type CanUseTool } from '@anthropic-ai/claude-agent-sdk';
import { MODEL, ROOT_DIR, TASTE_SKILL } from './config.js';
import type { JobKind } from './schemas.js';

export type AgentEvent =
  | { type: 'log'; text: string }
  | { type: 'file'; path: string; action: 'write' | 'edit' };

export interface RunOptions {
  mode: JobKind;
  projectDir: string;
  targetDir?: string;
  /** Ghi chú thêm vào cuối prompt, ví dụ lỗi JSON của lần chạy trước */
  extra?: string;
  onEvent: (e: AgentEvent) => void;
  signal?: AbortSignal;
}

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const READ_TOOLS = new Set(['Read', 'Glob', 'Grep', 'Skill', 'TodoWrite']);

const norm = (p: string) => path.resolve(p).toLowerCase();
const isInside = (file: string, root: string) => {
  const f = norm(file);
  const r = norm(root);
  return f === r || f.startsWith(r + path.sep);
};

/** Chỉ cho phép ghi trong folder dự án / folder prototype. Không có Bash nên không thể xóa file. */
function makePermission(allowedRoots: string[]): CanUseTool {
  return async (toolName, input) => {
    if (READ_TOOLS.has(toolName)) return { behavior: 'allow', updatedInput: input };
    if (WRITE_TOOLS.has(toolName)) {
      const file = String(input.file_path ?? input.notebook_path ?? '');
      if (file && allowedRoots.some((r) => isInside(file, r))) return { behavior: 'allow', updatedInput: input };
      return { behavior: 'deny', message: `Chỉ được ghi file trong: ${allowedRoots.join(', ')}` };
    }
    return { behavior: 'deny', message: `Công cụ ${toolName} không được phép trong tool này.` };
  };
}

const MAX_TURNS: Record<JobKind, number> = {
  'business-questions': 30,
  'ui-questions': 30,
  'business-srs': 250,
  'ui-srs': 250,
  prototype: 400,
};

/** Lỗi của tác vụ AI, kèm mã để giao diện xử lý riêng (ví dụ chạm giới hạn sử dụng). */
export class AgentError extends Error {
  constructor(
    message: string,
    public code: 'usage_limit' | 'auth' | 'network' | 'other' = 'other',
    /** Thời điểm hạn mức được làm mới (epoch giây), nếu SDK cho biết */
    public resetsAt?: number,
  ) {
    super(message);
  }
}

export const USAGE_LIMIT_MESSAGE = 'Đã chạm giới hạn sử dụng của tài khoản, vui lòng chờ rồi thử lại.';

const usageLimitError = (resetsAt?: number) => {
  const when = resetsAt
    ? ` Hạn mức sẽ được làm mới lúc ${new Date(resetsAt * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}.`
    : '';
  return new AgentError(USAGE_LIMIT_MESSAGE + when, 'usage_limit', resetsAt);
};

/** Dịch lỗi SDK/API sang tiếng Việt dễ hiểu. */
function explainError(code: string | undefined, fallback: string): AgentError {
  switch (code) {
    case 'authentication_failed':
    case 'oauth_org_not_allowed':
      return new AgentError('Phiên đăng nhập Claude Code không hợp lệ hoặc đã hết hạn. Chạy `claude` trong terminal để đăng nhập lại, rồi bấm "Chạy lại bước này".', 'auth');
    case 'rate_limit':
    case 'billing_error':
      return usageLimitError();
    case 'overloaded':
    case 'server_error':
      return new AgentError('Máy chủ Claude đang quá tải hoặc lỗi. Vui lòng thử lại.', 'network');
    case 'model_not_found':
      return new AgentError(`Không tìm thấy model "${MODEL}" hoặc tài khoản của bạn không dùng được model này. Kiểm tra CLAUDE_MODEL trong .env.`);
    default:
      return new AgentError(fallback);
  }
}

/** Nhận diện thông báo chạm giới hạn trong nội dung lỗi trả về dạng văn bản. */
const looksLikeUsageLimit = (text: string) => /usage limit|limit reached|rate.?limit|hit your limit|quota/i.test(text);

export async function runSkill(opts: RunOptions): Promise<void> {
  const { mode, projectDir, targetDir, onEvent } = opts;
  const lines = [`/srs-builder MODE: ${mode}`, `PROJECT_DIR: ${projectDir}`];
  if (targetDir) lines.push(`TARGET_DIR: ${targetDir}`);
  if (opts.extra) lines.push('', opts.extra);

  const allowedRoots = [projectDir, ...(targetDir ? [targetDir] : [])];
  const abort = new AbortController();
  opts.signal?.addEventListener('abort', () => abort.abort());

  let apiError: string | undefined;
  /** SDK báo hạn mức tài khoản claude.ai đã bị từ chối */
  let limited: { resetsAt?: number } | null = null;
  let finished = false;

  try {
    // Không truyền API key: SDK tự dùng phiên đăng nhập Claude Code của người dùng.
    const stream = query({
      prompt: lines.join('\n'),
      options: {
        cwd: ROOT_DIR,
        model: MODEL,
        settingSources: ['user', 'project'],
        skills: mode === 'prototype' ? ['srs-builder', TASTE_SKILL] : ['srs-builder'],
        tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Skill', 'TodoWrite'],
        additionalDirectories: targetDir ? [targetDir] : [],
        permissionMode: 'default',
        canUseTool: makePermission(allowedRoots),
        maxTurns: MAX_TURNS[mode],
        abortController: abort,
        env: { ...process.env, CLAUDE_AGENT_SDK_CLIENT_APP: 'ba-tool/1.0.0' },
      },
    });

    for await (const msg of stream) {
      if (msg.type === 'system' && msg.subtype === 'init') {
        const skills: string[] = msg.skills ?? [];
        if (!skills.includes('srs-builder')) {
          abort.abort();
          throw new AgentError('Không nạp được skill srs-builder (.claude/skills/srs-builder).');
        }
        if (mode === 'prototype' && !skills.includes(TASTE_SKILL)) {
          abort.abort();
          throw new AgentError(`Không tìm thấy skill "${TASTE_SKILL}" (taste skill) trong hệ thống. Kiểm tra ~/.claude/skills.`);
        }
        onEvent({ type: 'log', text: `Đã khởi động AI (${msg.model}).` });
      } else if (msg.type === 'rate_limit_event') {
        const info = msg.rate_limit_info;
        if (info.status === 'rejected') limited = { resetsAt: info.resetsAt };
        else if (info.status === 'allowed_warning') onEvent({ type: 'log', text: 'Cảnh báo: tài khoản sắp chạm giới hạn sử dụng.' });
      } else if (msg.type === 'assistant') {
        if (msg.error) apiError = msg.error;
        for (const block of msg.message.content) {
          if (block.type === 'tool_use') {
            const input = block.input as Record<string, unknown>;
            const file = typeof input.file_path === 'string' ? input.file_path : '';
            if (block.name === 'Write' || block.name === 'Edit' || block.name === 'MultiEdit') {
              onEvent({ type: 'file', path: file, action: block.name === 'Write' ? 'write' : 'edit' });
            } else if (block.name === 'Skill') {
              onEvent({ type: 'log', text: `Dùng skill: ${String(input.skill ?? input.command ?? '')}` });
            } else if (block.name === 'Read' && file) {
              onEvent({ type: 'log', text: `Đọc ${path.basename(file)}` });
            }
          } else if (block.type === 'text' && block.text.trim() && !msg.parent_tool_use_id) {
            onEvent({ type: 'log', text: block.text.trim().slice(0, 300) });
          }
        }
      } else if (msg.type === 'result') {
        finished = true;
        if (limited) throw usageLimitError(limited.resetsAt);
        if (msg.subtype !== 'success') {
          const reason =
            msg.subtype === 'error_max_turns'
              ? 'AI dừng vì vượt số bước tối đa. Hãy chạy lại bước này.'
              : 'AI gặp lỗi trong quá trình xử lý.';
          throw explainError(apiError, reason);
        }
        if (msg.is_error) {
          const text = String(msg.result || 'AI trả về lỗi.');
          throw looksLikeUsageLimit(text) ? usageLimitError() : explainError(apiError, text);
        }
      }
    }
  } catch (err) {
    if (opts.signal?.aborted) throw new AgentError('Đã hủy tác vụ.');
    if (err instanceof AgentError) throw err;
    if (limited) throw usageLimitError(limited.resetsAt);
    const m = err instanceof Error ? err.message : String(err);
    if (looksLikeUsageLimit(m)) throw usageLimitError();
    if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed|network/i.test(m)) {
      throw new AgentError('Mất kết nối tới Claude. Kiểm tra mạng rồi chạy lại bước này.', 'network');
    }
    throw explainError(apiError, m);
  }
  if (limited) throw usageLimitError(limited.resetsAt);
  if (!finished) throw explainError(apiError, 'AI kết thúc bất thường (không có kết quả).');
}
