// Kiểm tra Claude Code: đã cài chưa (lệnh `claude`) và đã đăng nhập tài khoản Claude chưa.
import { execFile } from 'node:child_process';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { envHasApiKey } from './config.js';

export interface AuthStatus {
  /** Có thể chạy tác vụ AI hay không (đã đăng nhập tài khoản Claude) */
  ready: boolean;
  cli: { installed: boolean; version?: string };
  account: { loggedIn: boolean; email?: string; subscriptionType?: string; error?: string };
  /** Môi trường đang có ANTHROPIC_API_KEY */
  envApiKey: boolean;
  checkedAt: string;
}

/** Chạy `claude --version`. Trên Windows lệnh là claude.cmd nên cần shell. */
function checkCli(): Promise<AuthStatus['cli']> {
  return new Promise((resolve) => {
    execFile('claude', ['--version'], { timeout: 15000, shell: process.platform === 'win32', windowsHide: true }, (err, stdout) => {
      if (err) resolve({ installed: false });
      else resolve({ installed: true, version: stdout.trim().split(/\r?\n/)[0] });
    });
  });
}

/**
 * Hỏi SDK thông tin tài khoản đang đăng nhập — đúng thông tin xác thực SDK sẽ dùng khi chạy.
 * Dùng prompt dạng luồng không bao giờ gửi tin nhắn, nên không tạo lượt hội thoại nào (không tốn hạn mức).
 */
async function checkAccount(): Promise<AuthStatus['account']> {
  let release!: () => void;
  const hold = new Promise<void>((r) => (release = r));
  async function* noMessages() {
    await hold;
  }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 30000);
  try {
    const q = query({ prompt: noMessages(), options: { abortController: abort, settingSources: [] } });
    const info = await q.accountInfo();
    // Khi chưa đăng nhập: không có email / gói, tokenSource = 'none'
    const loggedIn = Boolean(info.email || info.subscriptionType);
    return { loggedIn, email: info.email, subscriptionType: info.subscriptionType };
  } catch (e) {
    return { loggedIn: false, error: abort.signal.aborted ? 'Hết thời gian chờ kiểm tra đăng nhập.' : (e as Error).message };
  } finally {
    clearTimeout(timer);
    release();
    abort.abort();
  }
}

let cached: AuthStatus | null = null;
let running: Promise<AuthStatus> | null = null;

export function checkAuth(force = false): Promise<AuthStatus> {
  if (cached && !force) return Promise.resolve(cached);
  if (!running) {
    running = Promise.all([checkCli(), checkAccount()])
      .then(([cli, account]) => {
        cached = { ready: account.loggedIn, cli, account, envApiKey: envHasApiKey(), checkedAt: new Date().toISOString() };
        return cached;
      })
      .finally(() => (running = null));
  }
  return running;
}
