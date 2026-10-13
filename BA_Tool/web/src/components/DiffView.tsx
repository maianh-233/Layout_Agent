// Hiển thị thay đổi theo từng file (diff dạng unified): dòng thêm xanh, dòng bớt đỏ.
import { useState } from 'react';
import type { FileDiff } from '../types';

const STATUS_LABEL: Record<FileDiff['status'], string> = { added: 'Mới', removed: 'Đã xóa', modified: 'Đã sửa' };
const STATUS_CLS: Record<FileDiff['status'], string> = {
  added: 'bg-emerald-100 text-emerald-800',
  removed: 'bg-red-100 text-red-800',
  modified: 'bg-violet-100 text-violet-800',
};

export function DiffView({ diffs, emptyText = 'Không có thay đổi.' }: { diffs: FileDiff[]; emptyText?: string }) {
  // Mặc định mở file .md đầu tiên; file JSON nội bộ thu gọn
  const [open, setOpen] = useState<Set<string>>(() => new Set(diffs.filter((d) => d.path.endsWith('.md')).slice(0, 1).map((d) => d.path)));
  if (!diffs.length) return <p className="text-sm text-muted">{emptyText}</p>;
  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  return (
    <div className="space-y-2">
      {diffs.map((d) => (
        <div key={d.path} className="overflow-hidden rounded-xl border border-line bg-white">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-stone-50"
            aria-expanded={open.has(d.path)}
            onClick={() => toggle(d.path)}
          >
            <span className="text-muted">{open.has(d.path) ? '▾' : '▸'}</span>
            <span className="min-w-0 flex-1 truncate font-mono">{d.path}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[d.status]}`}>{STATUS_LABEL[d.status]}</span>
            <span className="text-xs tabular-nums">
              <span className="text-emerald-700">+{d.added}</span> <span className="text-red-700">−{d.removed}</span>
            </span>
          </button>
          {open.has(d.path) && <PatchBody patch={d.patch} />}
        </div>
      ))}
    </div>
  );
}

function PatchBody({ patch }: { patch: string }) {
  // Bỏ 4 dòng tiêu đề (Index / === / --- / +++) của createTwoFilesPatch
  const lines = patch.split('\n').filter((l, i) => i > 3 || !/^(Index:|={5,}|---|\+\+\+)/.test(l));
  return (
    <pre className="max-h-[60vh] overflow-auto border-t border-line bg-stone-50 text-[12.5px] leading-5">
      {lines.map((l, i) => {
        const cls = l.startsWith('@@')
          ? 'bg-sky-50 text-sky-800'
          : l.startsWith('+')
            ? 'bg-emerald-50 text-emerald-900'
            : l.startsWith('-')
              ? 'bg-red-50 text-red-900'
              : 'text-stone-600';
        return (
          <div key={i} className={`px-4 whitespace-pre-wrap break-words ${cls}`}>
            {l || ' '}
          </div>
        );
      })}
    </pre>
  );
}
