// Màn hình hướng dẫn khi Claude Code chưa sẵn sàng (chưa đăng nhập), và cảnh báo ANTHROPIC_API_KEY.
import { useState } from 'react';
import { api } from '../api';
import type { AuthStatus } from '../types';

function Cmd({ children }: { children: string }) {
  return <code className="rounded-md bg-stone-900 px-2 py-1 font-mono text-[13px] text-stone-100">{children}</code>;
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-sm font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
        {ok ? '✓' : '✕'}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function AuthSetupScreen({ status, onChange }: { status: AuthStatus | null; onChange: (s: AuthStatus) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const recheck = async () => {
    setBusy(true);
    setError('');
    try {
      onChange(await api.recheckAuth());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-bold">Cần đăng nhập Claude Code trước khi dùng tool</h1>
      <p className="mt-2 text-stone-600">
        Tool chạy bằng tài khoản Claude của chính bạn thông qua Claude Code trên máy này. Hãy làm theo 2 bước:
      </p>

      <ol className="mt-5 space-y-4 text-[15px]">
        <li>
          <b>1.</b> Mở terminal và chạy: <Cmd>npm install -g @anthropic-ai/claude-code</Cmd>
        </li>
        <li>
          <b>2.</b> Sau đó chạy <Cmd>claude</Cmd> để đăng nhập bằng tài khoản Claude (Pro / Max).
        </li>
      </ol>

      {status && (
        <ul className="mt-6 space-y-3 rounded-xl bg-stone-50 p-4 text-sm">
          <Check ok={status.cli.installed}>
            Lệnh <code>claude</code>:{' '}
            {status.cli.installed ? status.cli.version : 'chưa tìm thấy trong PATH'}
          </Check>
          <Check ok={status.account.loggedIn}>
            Tài khoản Claude:{' '}
            {status.account.loggedIn
              ? `đã đăng nhập${status.account.subscriptionType ? ` (${status.account.subscriptionType})` : ''}`
              : 'chưa đăng nhập'}
            {status.account.error && <span className="block text-xs text-muted">{status.account.error}</span>}
          </Check>
        </ul>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => void recheck()}>
          {busy ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
        </button>
        <span className="text-xs text-muted">Mỗi người dùng phải đăng nhập bằng tài khoản Claude của chính mình.</span>
      </div>
    </section>
  );
}

export function ApiKeyWarning() {
  return (
    <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <b>Cảnh báo:</b> máy đang có biến môi trường <code className="font-mono">ANTHROPIC_API_KEY</code> (trong hệ thống hoặc file{' '}
      <code className="font-mono">.env</code>). Biến này có thể khiến tool dùng API key (tính tiền riêng) thay vì tài khoản Claude Pro của bạn. Nên
      gỡ biến đó ra rồi khởi động lại <code className="font-mono">npm run dev</code>.
    </div>
  );
}

/** Dòng trạng thái nhỏ ở header: ai đang đăng nhập */
export function AccountBadge({ status }: { status: AuthStatus }) {
  if (!status.account.loggedIn) return null;
  return (
    <span className="hidden text-xs text-muted sm:inline">
      {status.account.subscriptionType ?? 'Claude'} · {status.account.email} · {status.model}
    </span>
  );
}
