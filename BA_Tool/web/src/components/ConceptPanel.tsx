// Chế độ nhanh — chọn định hướng thiết kế trước khi dựng. Mọi lựa chọn đều không bắt buộc:
// để "Tự động" thì tool nhận diện preset từ mô tả (cùng từ khóa với server/src/presets.ts).
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { SECTION_KINDS, type Concept, type MotionLevel, type PresetSummary, type SectionKind } from '../types';

export const EMPTY_CONCEPT: Concept = { preset: 'auto', motion: 'auto', sections: [], mood: '', reference: '' };

const MOTION: { value: MotionLevel; label: string; hint: string }[] = [
  { value: 'auto', label: 'Theo preset', hint: 'Mức hợp phong cách đã chọn' },
  { value: '1', label: '1 · Basic', hint: 'Hiện dần khi cuộn, hover' },
  { value: '2', label: '2 · Atmospheric', hint: 'Parallax, mây, hạt sáng, chữ trượt' },
  { value: '3', label: '3 · Advanced', hint: 'Cảnh nhiều lớp, cảnh ghim, trời đổi màu theo cuộn' },
];

const hasWord = (text: string, kw: string) =>
  new RegExp(`(?<![\\p{L}\\d])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\d])`, 'u').test(text);

/** Giống detectPreset ở server: preset có nhiều từ khóa khớp nhất */
function detect(presets: PresetSummary[], text: string): PresetSummary | undefined {
  const t = text.toLowerCase().normalize('NFC');
  let best: PresetSummary | undefined;
  let score = 0;
  for (const p of presets) {
    const s = p.keywords.filter((k) => hasWord(t, k)).length;
    if (s > score) [best, score] = [p, s];
  }
  return best;
}

export function ConceptPanel({ value, onChange, text }: { value: Concept; onChange: (c: Concept) => void; text: string }) {
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  useEffect(() => {
    api.listPresets().then(setPresets, () => setPresets([]));
  }, []);
  const detected = useMemo(() => detect(presets, `${text} ${value.mood}`), [presets, text, value.mood]);
  const active = value.preset === 'auto' ? detected : presets.find((p) => p.id === value.preset);
  const set = (patch: Partial<Concept>) => onChange({ ...value, ...patch });
  const toggleSection = (s: SectionKind) =>
    set({ sections: value.sections.includes(s) ? value.sections.filter((x) => x !== s) : [...value.sections, s] });

  if (!presets.length) return null;

  return (
    <div className="space-y-4 border-t border-line p-5">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Phong cách thiết kế</h3>
          <span className="text-xs text-muted">Không bắt buộc. Để Tự động thì AI chọn theo mô tả.</span>
        </div>
        <div role="radiogroup" aria-label="Phong cách" className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <PresetCard
            selected={value.preset === 'auto'}
            onSelect={() => set({ preset: 'auto' })}
            name="Tự động"
            tagline={detected ? `Nhận diện: ${detected.name}` : 'AI chọn theo ngành và mô tả'}
            swatches={detected?.swatches ?? []}
          />
          {presets.map((p) => (
            <PresetCard key={p.id} selected={value.preset === p.id} onSelect={() => set({ preset: p.id })} name={p.name} tagline={p.tagline} swatches={p.swatches} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Mức chuyển động</h3>
        <div role="radiogroup" aria-label="Mức chuyển động" className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {MOTION.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={value.motion === m.value}
              onClick={() => set({ motion: m.value })}
              className={[
                'rounded-xl border px-3 py-2 text-left transition',
                value.motion === m.value ? 'border-brand bg-brand-soft/50 ring-1 ring-brand' : 'border-line hover:border-stone-300',
              ].join(' ')}
            >
              <span className="block text-sm font-medium">
                {m.label}
                {m.value === 'auto' && active ? ` (${active.motion})` : ''}
              </span>
              <span className="block text-xs text-muted">{m.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <details className="group rounded-xl border border-line px-3 py-2" open={value.sections.length > 0 || !!value.mood || !!value.reference}>
        <summary className="cursor-pointer select-none text-sm font-medium text-stone-700">Tùy chọn thêm: section, màu / mood, tham khảo</summary>
        <div className="mt-3 space-y-3 pb-1">
          <div>
            <span className="text-xs text-muted">Section cần có (bấm theo thứ tự; bỏ trống = theo preset)</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SECTION_KINDS.map(([k, label]) => {
                const i = value.sections.indexOf(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={i >= 0}
                    onClick={() => toggleSection(k)}
                    className={[
                      'rounded-full border px-2.5 py-1 text-xs transition',
                      i >= 0 ? 'border-brand bg-brand text-white' : 'border-line text-muted hover:border-brand hover:text-brand-dark',
                    ].join(' ')}
                  >
                    {i >= 0 ? `${i + 1}. ` : '+ '}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block text-xs text-muted">
            Màu / mood
            <input className="input mt-1" maxLength={500} placeholder="Ví dụ: hoàng hôn cam đào, cô đơn nhưng ấm áp" value={value.mood} onChange={(e) => set({ mood: e.target.value })} />
          </label>
          <label className="block text-xs text-muted">
            Tham khảo (link hoặc ghi chú)
            <input className="input mt-1" maxLength={1000} placeholder="Ví dụ: cảm giác giống phim Your Name; ảnh cánh đồng, ga tàu vắng" value={value.reference} onChange={(e) => set({ reference: e.target.value })} />
          </label>
        </div>
      </details>
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
