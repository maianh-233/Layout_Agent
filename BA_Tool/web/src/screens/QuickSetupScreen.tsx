// Chế độ nhanh — màn hình cấu hình website (sau khi bấm "Tạo dự án").
// Mọi lựa chọn gom thành một cấu hình (Concept) — tự lưu nháp lên server nên quay lại / tải lại trang không mất dữ liệu.
// Phong cách + mức chuyển động dùng lại StylePicker / MotionPicker (cùng preset & mức với server/src/presets.ts).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../api';
import { MotionPicker, StylePicker, detectPreset } from '../components/ConceptPanel';
import { normalizeConcept, type Concept, type QuickCatalog } from '../types';

interface Props {
  slug: string;
  initial: Concept | undefined;
  onSubmit: (concept: Concept) => Promise<void>;
  /** Quay lại màn hình trước (danh sách dự án, hoặc website đã dựng) — nháp đã được lưu */
  onBack: () => void;
  backLabel: string;
}

const TOPIC_EXAMPLES = [
  'Website giới thiệu công ty công nghệ',
  'Website thương hiệu thời trang Việt Nam',
  'Website du lịch khám phá Nhật Bản',
  'Website portfolio cá nhân',
  'Website giới thiệu dự án kiến trúc',
];
const PURPOSE_EXAMPLES = [
  'Giới thiệu doanh nghiệp',
  'Xây dựng nhận diện thương hiệu',
  'Trình bày dự án và sản phẩm',
  'Giới thiệu dịch vụ',
  'Xây dựng portfolio cá nhân',
  'Truyền tải câu chuyện và giá trị thương hiệu',
  'Cung cấp thông tin và hướng dẫn',
  'Giới thiệu một sự kiện hoặc chiến dịch',
];
const SECTION_PLACEHOLDER: Record<string, string> = {
  story: 'Ví dụ: Kể về quá trình hình thành thương hiệu và cảm hứng từ văn hóa Việt Nam.',
  gallery: 'Ví dụ: Ảnh mang cảm giác phim analog, ánh sáng tự nhiên, màu hoài cổ.',
  services: 'Ví dụ: 3 dịch vụ chính — tư vấn, thiết kế, thi công; mỗi dịch vụ có trang chi tiết.',
  projects: 'Ví dụ: 4 dự án tiêu biểu, mỗi dự án có bối cảnh, giải pháp, kết quả.',
  blog: 'Ví dụ: 3 bài viết mẫu về xu hướng, mẹo, câu chuyện khách hàng.',
};
const NOTES_PLACEHOLDER =
  'Nhập các yêu cầu khác về bố cục, nội dung, đối tượng khách hàng, hình ảnh, chức năng, cách kể chuyện, những điều cần tránh hoặc các chi tiết đặc biệt mà bạn muốn website thể hiện…\n\n' +
  'Ví dụ:\n- Website chỉ giới thiệu thương hiệu, không có mua hàng hoặc thanh toán.\n- Ưu tiên bố cục editorial, nhiều khoảng trắng, typography nổi bật.\n- Không sử dụng gradient quá nhiều.\n- Những chức năng chưa có backend không được giả vờ hoạt động.';

const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function QuickSetupScreen({ slug, initial, onSubmit, onBack, backLabel }: Props) {
  const [catalog, setCatalog] = useState<QuickCatalog | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [c, setC] = useState<Concept>(() => normalizeConcept(initial));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; at?: Date; error?: string }>({ state: 'idle' });

  useEffect(() => {
    api.quickCatalog().then(setCatalog, (e: Error) => setCatalogError(e.message));
  }, []);

  // ----- Tự lưu nháp (debounce), lưu nốt khi rời màn hình -----
  const latest = useRef(c);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const flush = async (keepalive = false) => {
    window.clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setSave({ state: 'saving' });
    try {
      await api.saveConcept(slug, latest.current, { keepalive });
      setSave({ state: 'saved', at: new Date() });
    } catch (e) {
      dirty.current = true;
      setSave({ state: 'error', error: (e as Error).message });
    }
  };
  const update = (patch: Partial<Concept>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setC(next);
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), 800);
  };
  useEffect(() => {
    const onLeave = () => void flush(true);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      void flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Kiểm tra dữ liệu -----
  const limits = catalog?.limits;
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (c.topic.trim().length < 3) e.topic = 'Hãy nhập chủ đề website (ít nhất 3 ký tự).';
    if (!c.brand.trim()) e.brand = 'Hãy nhập tên công ty / thương hiệu / dự án.';
    if (limits) {
      const over = (k: keyof typeof limits, v: string, label: string) => {
        if (v.length > limits[k]) e[k] = `${label} dài ${v.length.toLocaleString('vi-VN')} ký tự, vượt giới hạn ${limits[k].toLocaleString('vi-VN')}. Hãy rút gọn — tool không tự cắt bớt.`;
      };
      over('topic', c.topic, 'Chủ đề');
      over('brand', c.brand, 'Tên thương hiệu');
      over('purpose', c.purpose, 'Mục đích');
      over('colors', c.colors, 'Màu sắc');
      over('font', c.font, 'Font chữ');
      over('notes', c.notes, 'Chú thích bổ sung');
      for (const s of c.sections) if (s.description.length > limits.sectionNote) e[`section-${s.id}`] = `Mô tả section quá ${limits.sectionNote.toLocaleString('vi-VN')} ký tự.`;
    }
    return e;
  }, [c, limits]);
  const show = (k: string) => (tried || touched[k]) && errors[k];
  const valid = Object.keys(errors).length === 0;

  const presets = catalog?.presets ?? [];
  const detected = useMemo(() => detectPreset(presets, [c.topic, c.purpose, c.colors, c.notes].join(' ')), [presets, c.topic, c.purpose, c.colors, c.notes]);
  const activePreset = c.preset === 'auto' ? detected : presets.find((p) => p.id === c.preset);

  const toggleSection = (id: string) => {
    const cur = latest.current.sections;
    update({ sections: cur.some((s) => s.id === id) ? cur.filter((s) => s.id !== id) : [...cur, { id, description: '' }] });
  };
  const setSectionNote = (id: string, description: string) => update({ sections: latest.current.sections.map((s) => (s.id === id ? { ...s, description } : s)) });

  const submit = async () => {
    setTried(true);
    if (!valid || busy) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      window.clearTimeout(timer.current);
      dirty.current = false;
      await onSubmit(c);
    } finally {
      setBusy(false);
    }
  };

  const back = async () => {
    await flush();
    onBack();
  };

  const optionalCount = [c.colors, c.font, c.sections.length ? 'x' : ''].filter(Boolean).length;

  return (
    <section className="mx-auto max-w-5xl space-y-5 pb-28">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cấu hình website</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            AI sẽ lập sitemap và dựng <strong>website nhiều trang</strong> theo cấu hình này. Chỉ <strong>chủ đề</strong> và <strong>tên thương hiệu</strong> là bắt buộc — phần còn lại để trống thì AI tự quyết định.
          </p>
        </div>
        <SaveStatus save={save} onRetry={() => void flush()} />
      </div>

      {catalogError && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-800">Không tải được danh mục phong cách / section: {catalogError}</p>}

      {/* 1. Thông tin bắt buộc */}
      <Card title="Thông tin chính" badge="Bắt buộc">
        <Field id="topic" label="Chủ đề website" required error={show('topic')}>
          <input
            id="topic"
            className="input"
            placeholder="Ví dụ: Website thương hiệu thời trang Việt Nam"
            value={c.topic}
            aria-invalid={!!show('topic')}
            onBlur={() => setTouched((t) => ({ ...t, topic: true }))}
            onChange={(e) => update({ topic: e.target.value })}
          />
          <Chips items={TOPIC_EXAMPLES} onPick={(t) => update({ topic: t })} />
        </Field>
        <Field id="brand" label="Tên công ty / thương hiệu / dự án" required hint="Website cá nhân: ghi tên của bạn hoặc tên dự án. Tên này xuất hiện ở tiêu đề, header, footer." error={show('brand')}>
          <input
            id="brand"
            className="input"
            placeholder="Ví dụ: AN NAM KÝ"
            value={c.brand}
            aria-invalid={!!show('brand')}
            onBlur={() => setTouched((t) => ({ ...t, brand: true }))}
            onChange={(e) => update({ brand: e.target.value })}
          />
        </Field>
        <Field id="purpose" label="Mục đích tạo website" hint="Không bắt buộc — để trống thì AI suy ra từ chủ đề. Quyết định các trang, nội dung và chức năng." error={show('purpose')}>
          <textarea
            id="purpose"
            rows={3}
            className="input resize-y"
            placeholder="Ví dụ: Giới thiệu thương hiệu và câu chuyện văn hóa; khách xem bộ sưu tập và liên hệ đặt may."
            value={c.purpose}
            aria-invalid={!!show('purpose')}
            onChange={(e) => update({ purpose: e.target.value })}
          />
          <Chips
            items={PURPOSE_EXAMPLES}
            prefix="+ "
            onPick={(t) => {
              const cur = latest.current.purpose.trim();
              if (!cur.toLowerCase().includes(t.toLowerCase())) update({ purpose: cur ? `${cur.replace(/[.;]$/, '')}; ${t.toLowerCase()}` : t });
            }}
          />
        </Field>
      </Card>

      {/* 2–3. Phong cách & chuyển động (dùng lại thành phần có sẵn) */}
      <Card title="Phong cách thiết kế" hint="Áp dụng vào bố cục, chữ, màu, ảnh, khoảng trắng và hiệu ứng.">
        {presets.length ? <StylePicker presets={presets} value={c.preset} onChange={(preset) => update({ preset })} detected={detected} /> : <p className="text-sm text-muted">Đang tải…</p>}
      </Card>
      <Card title="Mức chuyển động" hint="Tôn trọng cài đặt giảm chuyển động (prefers-reduced-motion) của người xem.">
        <MotionPicker value={c.motion} onChange={(motion) => update({ motion })} presetMotion={activePreset?.motion} />
      </Card>

      {/* 4. Ngôn ngữ */}
      <Card title="Ngôn ngữ website" hint="Toàn bộ nội dung website dùng ngôn ngữ này (một ngôn ngữ, không có nút chuyển ngôn ngữ).">
        <div role="radiogroup" aria-label="Ngôn ngữ website" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {(catalog?.languages ?? []).map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={c.language === l.id}
              onClick={() => update({ language: l.id })}
              className={[
                'rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                c.language === l.id ? 'border-brand bg-brand-soft/50 ring-1 ring-brand' : 'border-line hover:border-stone-300',
              ].join(' ')}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 5. Tùy chọn thêm */}
      <details className="group rounded-2xl border border-line bg-white shadow-sm" open={optionalCount > 0 || undefined}>
        <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4">
          <span>
            <span className="font-semibold">Tùy chọn thêm</span>
            <span className="ml-2 text-xs text-muted">màu sắc, font chữ, section{optionalCount ? ` · đã điền ${optionalCount}` : ''}</span>
          </span>
          <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-5 border-t border-line px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="colors" label="Màu sắc mong muốn" hint="Mã HEX, tên màu hoặc mô tả. Để trống: AI chọn theo chủ đề & phong cách." error={show('colors') || errors.colors}>
              <input id="colors" className="input" placeholder="Ví dụ: #1F3A5F, burgundy, kem và xanh rêu" value={c.colors} onChange={(e) => update({ colors: e.target.value })} />
            </Field>
            <Field id="font" label="Font chữ mong muốn" hint="Tool kiểm tra font có đủ ký tự của ngôn ngữ đã chọn và thêm font dự phòng." error={show('font') || errors.font}>
              <input id="font" className="input" placeholder="Ví dụ: Playfair Display" value={c.font} onChange={(e) => update({ font: e.target.value })} />
            </Field>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-medium">Section / nhóm nội dung</h4>
              <span className="text-xs text-muted">
                {c.sections.length ? `Đã chọn ${c.sections.length} — AI đặt vào đúng trang (trang chủ / trang riêng / trang chi tiết)` : 'Không chọn: AI tự đề xuất cấu trúc & sitemap'}
                {c.sections.length > 0 && (
                  <button type="button" className="ml-2 underline" onClick={() => update({ sections: [] })}>
                    Bỏ chọn tất cả
                  </button>
                )}
              </span>
            </div>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {(catalog?.sections ?? []).map((s) => {
                const i = c.sections.findIndex((x) => x.id === s.id);
                const picked = i >= 0 ? c.sections[i] : null;
                return (
                  <li key={s.id} className={['rounded-xl border p-3 transition', picked ? 'border-brand bg-brand-soft/30' : 'border-line'].join(' ')}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-1 size-4 accent-brand" checked={!!picked} onChange={() => toggleSection(s.id)} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {picked && <span className="mr-1 rounded bg-brand px-1.5 py-0.5 text-[11px] text-white">{i + 1}</span>}
                          {s.label}
                        </span>
                        <span className="block text-xs text-muted">{s.hint}</span>
                      </span>
                    </label>
                    {picked && (
                      <div className="mt-2 pl-7">
                        <label className="block text-xs text-muted" htmlFor={`sec-${s.id}`}>
                          Mô tả mong muốn (không bắt buộc — để trống AI tự xây dựng)
                        </label>
                        <textarea
                          id={`sec-${s.id}`}
                          rows={2}
                          className="input mt-1 resize-y text-sm"
                          placeholder={SECTION_PLACEHOLDER[s.id] ?? 'Nội dung, hình ảnh, cách trình bày mong muốn cho section này…'}
                          value={picked.description}
                          aria-invalid={!!errors[`section-${s.id}`]}
                          onChange={(e) => setSectionNote(s.id, e.target.value)}
                        />
                        {errors[`section-${s.id}`] && <p className="mt-1 text-xs text-red-700">{errors[`section-${s.id}`]}</p>}
                        <p className="mt-1 text-[11px] text-muted">Gợi ý vị trí: {s.place}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </details>

      {/* 6. Chú thích bổ sung */}
      <Card title="Chú thích bổ sung" hint="Không bắt buộc. Gửi nguyên văn cho AI — không bị cắt, kể cả phần cuối.">
        <label htmlFor="notes" className="sr-only">
          Chú thích bổ sung
        </label>
        <textarea
          id="notes"
          rows={10}
          className="input min-h-48 resize-y leading-relaxed"
          placeholder={NOTES_PLACEHOLDER}
          value={c.notes}
          aria-invalid={!!errors.notes}
          aria-describedby="notes-count"
          onChange={(e) => update({ notes: e.target.value })}
        />
        <p id="notes-count" className={['mt-1 text-right text-xs', errors.notes ? 'font-medium text-red-700' : 'text-muted'].join(' ')}>
          {c.notes.length.toLocaleString('vi-VN')} / {(limits?.notes ?? 20000).toLocaleString('vi-VN')} ký tự · {c.notes ? c.notes.split('\n').length : 0} dòng
        </p>
        {errors.notes && <p className="text-sm text-red-700">{errors.notes}</p>}
      </Card>

      {/* 7. Prompt mẫu */}
      <SamplePrompt concept={c} catalog={catalog} />

      {/* Thanh hành động */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" className="btn-ghost" onClick={() => void back()}>
            ← {backLabel}
          </button>
          <span className="min-w-0 flex-1 text-sm text-red-700" role="status">
            {tried && !valid ? `Còn ${Object.keys(errors).length} mục cần sửa: ${Object.values(errors)[0]}` : ''}
          </span>
          <button type="button" className="btn-primary" disabled={busy || (tried && !valid)} onClick={() => void submit()}>
            {busy ? 'Đang bắt đầu…' : 'Bắt đầu tạo website ➤'}
          </button>
        </div>
      </div>
    </section>
  );
}

function Card({ title, hint, badge, children }: { title: string; hint?: string; badge?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-semibold">{title}</h3>
        {badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">{badge}</span>}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ id, label, hint, required, error, children }: { id: string; label: string; hint?: string; required?: boolean; error?: string | false; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span className="text-red-600"> *</span> : <span className="ml-1 text-xs font-normal text-muted">(tùy chọn)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function Chips({ items, onPick, prefix = '' }: { items: string[]; onPick: (t: string) => void; prefix?: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-brand hover:text-brand-dark"
          onClick={() => onPick(t)}
        >
          {prefix}
          {t}
        </button>
      ))}
    </div>
  );
}

function SaveStatus({ save, onRetry }: { save: { state: string; at?: Date; error?: string }; onRetry: () => void }) {
  if (save.state === 'saving') return <span className="text-xs text-muted">Đang lưu nháp…</span>;
  if (save.state === 'saved' && save.at) return <span className="text-xs text-muted">✓ Đã lưu nháp lúc {fmtTime(save.at)}</span>;
  if (save.state === 'error')
    return (
      <span className="text-xs text-red-700">
        Chưa lưu được nháp ({save.error}).{' '}
        <button type="button" className="underline" onClick={onRetry}>
          Thử lại
        </button>
      </span>
    );
  return <span className="text-xs text-muted">Tự lưu nháp khi bạn nhập</span>;
}

// ---------- Prompt mẫu ----------

const blank = (v: string, hint: string) => (v.trim() ? v.trim() : `[${hint}]`);

/** Prompt mẫu theo đúng cấu trúc màn hình cấu hình — điền sẵn những gì BA đã nhập, phần trống là chỗ cần điền. */
export function buildSamplePrompt(c: Concept, catalog: QuickCatalog | null): string {
  const preset = c.preset === 'auto' ? 'Tự động (AI chọn theo chủ đề)' : catalog?.presets.find((p) => p.id === c.preset)?.name ?? c.preset;
  const motion = c.motion === 'auto' ? 'Theo phong cách' : `Level ${c.motion}`;
  const lang = catalog?.languages.find((l) => l.id === c.language)?.label ?? c.language;
  const sectionLabel = (id: string) => catalog?.sections.find((s) => s.id === id)?.label ?? id;
  const sections = c.sections.length
    ? c.sections.map((s) => `- ${sectionLabel(s.id)}: ${s.description.trim() || '[mô tả mong muốn — để trống để AI tự xây dựng]'}`)
    : ['- [Chọn các section: Hero, About, Services, Projects, Gallery, Testimonials, Team, Process, FAQ, Blog, Contact… — kèm mô tả nếu có]'];
  return [
    'Tạo một WEBSITE NHIỀU TRANG (không phải một landing page) với cấu hình sau:',
    '',
    `1. Chủ đề: ${blank(c.topic, 'chủ đề website, ví dụ: website thương hiệu thời trang Việt Nam')}`,
    `2. Thương hiệu / dự án: ${blank(c.brand, 'tên công ty / thương hiệu / tên cá nhân')}`,
    `3. Mục đích: ${blank(c.purpose, 'giới thiệu doanh nghiệp / portfolio / giới thiệu dịch vụ / sự kiện…')}`,
    `4. Phong cách thiết kế: ${preset}`,
    `5. Mức chuyển động: ${motion}`,
    `6. Ngôn ngữ chính: ${lang} — toàn bộ menu, tiêu đề, nút, form, footer dùng ngôn ngữ này`,
    `7. Màu sắc: ${blank(c.colors, 'mã HEX / tên màu / mô tả, hoặc để AI tự chọn')}`,
    `8. Font chữ: ${blank(c.font, 'tên font, hoặc để AI tự chọn — phải hỗ trợ ngôn ngữ đã chọn')}`,
    '9. Section và mô tả riêng:',
    ...sections,
    '10. Yêu cầu trang & điều hướng:',
    '- Lập sitemap trước: trang chủ + các trang riêng (About, Services, Projects, Blog, Contact…) và trang chi tiết khi cần.',
    '- Header, footer, menu giống nhau trên mọi trang; mọi link dẫn tới trang / mục có thật.',
    '- Ảnh thật, đúng chủ đề của từng trang; không ảnh giả, không link ảnh tự nghĩ.',
    '- Chức năng chưa có backend (form, đặt chỗ, thanh toán) ghi rõ là bản demo, không giả vờ hoạt động.',
    '11. Chú thích bổ sung:',
    c.notes.trim() ? c.notes.trim() : '[đối tượng khách hàng, bố cục, hình ảnh, cách kể chuyện, những điều cần tránh…]',
  ].join('\n');
}

function SamplePrompt({ concept, catalog }: { concept: Concept; catalog: QuickCatalog | null }) {
  const text = useMemo(() => buildSamplePrompt(concept, catalog), [concept, catalog]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        area.current?.select();
        if (!document.execCommand('copy')) throw new Error('copy');
      }
      setMsg({ ok: true, text: 'Đã sao chép prompt mẫu.' });
    } catch {
      area.current?.select();
      setMsg({ ok: false, text: 'Không sao chép được tự động — prompt đã được chọn sẵn, bấm Ctrl+C để sao chép.' });
    }
    window.setTimeout(() => setMsg(null), 4000);
  };
  return (
    <details className="group rounded-2xl border border-line bg-white shadow-sm">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4">
        <span>
          <span className="font-semibold">Prompt mẫu — Sao chép để sử dụng</span>
          <span className="ml-2 text-xs text-muted">điền sẵn theo cấu hình hiện tại; chỗ trong [ ] là phần còn thiếu</span>
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-line px-5 py-4">
        <label htmlFor="sample-prompt" className="sr-only">
          Prompt mẫu
        </label>
        <textarea id="sample-prompt" ref={area} readOnly rows={14} className="input resize-y bg-stone-50 font-mono text-xs leading-relaxed" value={text} />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-outline py-1.5" onClick={() => void copy()}>
            ⧉ Sao chép prompt
          </button>
          <span role="status" aria-live="polite" className={['text-xs', msg?.ok === false ? 'text-red-700' : 'text-emerald-700'].join(' ')}>
            {msg?.text}
          </span>
          <span className="ml-auto text-xs text-muted">Sao chép không thay đổi nội dung bạn đã nhập.</span>
        </div>
      </div>
    </details>
  );
}
