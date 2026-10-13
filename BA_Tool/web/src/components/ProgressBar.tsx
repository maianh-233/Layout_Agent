// Thanh tiến trình 4 bước: ① Nghiệp vụ → ② Giao diện → ③ Dựng prototype → ④ Hoàn tất
import { STEP_LABELS } from '../types';

interface Props {
  current: number;
  /** Bước lớn nhất người dùng đã tới — cho phép bấm quay lại */
  reached: number;
  onSelect?: (step: number) => void;
}

export function ProgressBar({ current, reached, onSelect }: Props) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onSelect && i <= reached && !active;
        return (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelect(i)}
              className={[
                'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition',
                active ? 'bg-brand text-white' : done ? 'bg-brand-soft text-brand-dark' : 'bg-stone-100 text-muted',
                clickable ? 'hover:ring-2 hover:ring-brand/30 cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              <span
                className={[
                  'grid size-6 place-items-center rounded-full text-xs font-semibold',
                  active ? 'bg-white text-brand' : done ? 'bg-brand text-white' : 'bg-white text-muted',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="font-medium">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && <span className="text-stone-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
