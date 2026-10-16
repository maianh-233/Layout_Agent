// Chế độ nhanh — chọn phong cách thiết kế (preset) và mức chuyển động. Dùng trong màn hình cấu hình website.
// Để "Tự động" thì tool nhận diện preset từ mô tả (cùng từ khóa với server/src/presets.ts).
import type { MotionLevel, PresetSummary } from '../types';

const MOTION: { value: MotionLevel; label: string; hint: string }[] = [
  { value: 'auto', label: 'Theo preset', hint: 'Mức hợp phong cách đã chọn' },
  { value: '1', label: '1 · Basic', hint: 'Hiện dần khi cuộn, hover — nhẹ, ưu tiên hiệu suất' },
  { value: '2', label: '2 · Atmospheric', hint: 'Parallax, mây, hạt sáng, chữ trượt — có chọn lọc' },
  { value: '3', label: '3 · Advanced', hint: 'Cảnh nhiều lớp, cảnh ghim, trời đổi màu theo cuộn' },
];

const hasWord = (text: string, kw: string) =>
  new RegExp(`(?<![\\p{L}\\d])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'u').test(text);

/** Giống detectPreset ở server: preset có nhiều từ khóa khớp nhất */
export function detectPreset(presets: PresetSummary[], text: string): PresetSummary | undefined {
  const t = text.toLowerCase().normalize('NFC');
  let best: PresetSummary | undefined;
  let score = 0;
  for (const p of presets) {
    const s = p.keywords.filter((k) => hasWord(t, k)).length;
    if (s > score) [best, score] = [p, s];
  }
  return best;
}

export function StylePicker({
  presets,
  value,
  onChange,
  detected,
}: {
  presets: PresetSummary[];
  value: string;
  onChange: (id: string) => void;
  /** Preset tool nhận diện được khi để Tự động */
  detected?: PresetSummary;
}) {
  return (
    <div role="radiogroup" aria-label="Phong cách thiết kế" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <PresetCard
        selected={value === 'auto'}
        onSelect={() => onChange('auto')}
        name="Tự động"
        tagline={detected ? `Nhận diện: ${detected.name}` : 'AI chọn theo chủ đề và mô tả'}
        swatches={detected?.swatches ?? []}
      />
      {presets.map((p) => (
        <PresetCard key={p.id} selected={value === p.id} onSelect={() => onChange(p.id)} name={p.name} tagline={p.tagline} swatches={p.swatches} />
      ))}
    </div>
  );
}

export function MotionPicker({ value, onChange, presetMotion }: { value: MotionLevel; onChange: (m: MotionLevel) => void; presetMotion?: number }) {
  return (
    <div role="radiogroup" aria-label="Mức chuyển động" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {MOTION.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={value === m.value}
          onClick={() => onChange(m.value)}
          className={[
            'rounded-xl border px-3 py-2 text-left transition',
            value === m.value ? 'border-brand bg-brand-soft/50 ring-1 ring-brand' : 'border-line hover:border-stone-300',
          ].join(' ')}
        >
          <span className="block text-sm font-medium">
            {m.label}
            {m.value === 'auto' && presetMotion ? ` (${presetMotion})` : ''}
          </span>
          <span className="block text-xs text-muted">{m.hint}</span>
        </button>
      ))}
    </div>
  );
}

function PresetCard({ selected, onSelect, name, tagline, swatches }: { selected: boolean; onSelect: () => void; name: string; tagline: string; swatches: string[] }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        'flex min-w-0 flex-col gap-2 rounded-xl border p-3 text-left transition',
        selected ? 'border-brand bg-brand-soft/40 ring-1 ring-brand' : 'border-line hover:border-stone-300 hover:bg-stone-50',
      ].join(' ')}
    >
      <span className="flex h-3 overflow-hidden rounded-full bg-stone-100">
        {swatches.map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </span>
      <span className="text-sm font-medium leading-snug">{name}</span>
      <span className="line-clamp-2 text-xs text-muted">{tagline}</span>
    </button>
  );
}
