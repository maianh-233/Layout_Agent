// Hộp thoại xác nhận đơn giản.
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-900/40 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-3 text-sm leading-6 text-stone-600">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Quay lại
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BannerProps {
  message: string;
  title?: string;
  tone?: 'error' | 'warning';
  retryLabel?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ErrorBanner({ message, title, tone = 'error', retryLabel = 'Thử lại', onRetry, onClose }: BannerProps) {
  const warn = tone === 'warning';
  return (
    <div
      role="alert"
      className={[
        'flex flex-wrap items-start gap-3 rounded-xl border p-4 text-sm',
        warn ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-800',
      ].join(' ')}
    >
      <span className="font-semibold">{title ? `${title}:` : 'Lỗi:'}</span>
      <span className="min-w-0 flex-1 whitespace-pre-wrap">{message}</span>
      <span className="flex gap-2">
        {onRetry && (
          <button
            type="button"
            className={['rounded-lg px-3 py-1 font-medium text-white', warn ? 'bg-amber-700 hover:bg-amber-800' : 'bg-red-700 hover:bg-red-800'].join(' ')}
            onClick={onRetry}
          >
            {retryLabel}
          </button>
        )}
        {onClose && (
          <button type="button" className={['rounded-lg px-2 py-1', warn ? 'hover:bg-amber-100' : 'hover:bg-red-100'].join(' ')} onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        )}
      </span>
    </div>
  );
}
