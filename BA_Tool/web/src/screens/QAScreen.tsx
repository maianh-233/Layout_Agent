// Màn hình 2 / 4 — Trả lời câu hỏi, mỗi lần một câu. Tự lưu khi chuyển câu, khi ngừng gõ và khi đóng trang.
// Câu có showIf tự ẩn theo câu trả lời; cuối cùng có vòng câu hỏi bổ sung (bỏ qua được).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { ConfirmDialog, ErrorBanner } from '../components/ConfirmDialog';
import { OTHER, flatten, hasContent, visibleIds, type Answer, type FlatQuestion, type Phase, type Project } from '../types';

export type FinishMode = 'followup' | 'srs';

interface Props {
  project: Project;
  phase: Phase;
  onFinish: (mode: FinishMode) => Promise<void>;
}

type Status = 'answered' | 'skipped' | 'todo';

function statusOf(a: Answer | undefined): Status {
  if (a?.status === 'skipped') return 'skipped';
  return hasContent(a) ? 'answered' : 'todo';
}

/** Vị trí cuối cùng thỏa điều kiện (Array.findLastIndex chưa có trong lib ES2022). */
function lastIndex<T>(arr: T[], pred: (x: T, i: number) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i], i)) return i;
  return -1;
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

export function QAScreen({ project, phase, onFinish }: Props) {
  const state = project[phase];
  const questions = useMemo(() => flatten(state.questions), [state.questions]);
  const [answers, setAnswers] = useState<Record<string, Answer>>(state.answers);
  const [notes, setNotes] = useState<Record<string, string>>(state.notes ?? {});
  const [index, setIndex] = useState(Math.min(state.currentIndex, Math.max(questions.length - 1, 0)));
  const [sidebar, setSidebar] = useState(true);
  const [query, setQuery] = useState('');
  /** Nhóm đang mở trong sidebar (mặc định: nhóm của câu hiện tại) */
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([questions[index]?.groupId]));
  const [noteOpen, setNoteOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [finishing, setFinishing] = useState(false);

  const visible = useMemo(() => visibleIds(questions, answers), [questions, answers]);
  const visibleList = useMemo(() => questions.filter((x) => visible.has(x.id)), [questions, visible]);

  // Lưu lên server. Dùng ref để luôn gửi bản mới nhất.
  const latest = useRef({ answers, notes, index });
  latest.current = { answers, notes, index };
  const save = useCallback(
    async (keepalive = false) => {
      if (!keepalive) setSaved('saving');
      try {
        const { answers: a, notes: n, index: i } = latest.current;
        await api.saveAnswers(project.slug, phase, { answers: a, notes: n, currentIndex: i }, { keepalive });
        if (!keepalive) setSaved('saved');
      } catch (e) {
        if (!keepalive) {
          setError((e as Error).message);
          setSaved('idle');
        }
      }
    },
    [project.slug, phase],
  );

  // Tự lưu 1,5 giây sau khi ngừng gõ
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => void save(), 1500);
    return () => clearTimeout(t);
  }, [answers, notes, save]);

  // Đóng tab / chuyển trang: gửi bản cuối cùng (keepalive để trình duyệt vẫn gửi xong)
  useEffect(() => {
    const flush = () => void save(true);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [save]);

  const go = (i: number) => {
    latest.current.index = i;
    setIndex(i);
    setNoteOpen(Boolean(notes[questions[i]?.id]?.trim()));
    setOpenGroups((prev) => new Set(prev).add(questions[i].groupId));
    void save();
  };

  // Câu hiện tại bị ẩn (ví dụ vừa mở lại dự án) → nhảy tới câu hiện kế tiếp
  const current = questions[index];
  useEffect(() => {
    if (!current || visible.has(current.id)) return;
    const next = questions.findIndex((x, i) => i > index && visible.has(x.id));
    const prev = lastIndex(questions, (x, i) => i < index && visible.has(x.id));
    const target = next >= 0 ? next : prev;
    if (target >= 0) go(target);
  }, [current, visible]);

  if (questions.length === 0) return <p className="text-muted">Chưa có câu hỏi.</p>;

  const q = current;
  const a = answers[q.id];
  const nextIndex = questions.findIndex((x, i) => i > index && visible.has(x.id));
  const prevIndex = lastIndex(questions, (x, i) => i < index && visible.has(x.id));
  const isLast = nextIndex < 0;
  const position = visibleList.findIndex((x) => x.id === q.id) + 1;
  const counts = visibleList.reduce(
    (c, x) => {
      c[statusOf(answers[x.id])]++;
      return c;
    },
    { answered: 0, skipped: 0, todo: 0 } as Record<Status, number>,
  );
  const followupList = visibleList.filter((x) => x.followup);
  const followupDone = Boolean(state.followupStatus);

  const setAnswer = (next: Answer) => setAnswers((prev) => ({ ...prev, [q.id]: next }));
  const setNote = (text: string) => setNotes((prev) => ({ ...prev, [q.id]: text }));

  const skip = () => {
    setAnswers((prev) => ({ ...prev, [q.id]: { status: 'skipped', value: prev[q.id]?.value ?? '', other: prev[q.id]?.other } }));
    if (!isLast) go(nextIndex);
    else void save();
  };

  const finish = async (mode: FinishMode) => {
    setConfirm(false);
    setFinishing(true);
    try {
      await save();
      await onFinish(mode);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinishing(false);
    }
  };

  // Sidebar: nhóm câu hỏi với tiến độ; khi tìm kiếm thì chỉ hiện câu khớp
  const needle = fold(query.trim());
  const groups = state.questions!.groups.map((g) => {
    const items = g.questions
      .map((gq) => ({ q: gq, i: questions.findIndex((x) => x.id === gq.id) }))
      .filter(({ q: gq }) => visible.has(gq.id));
    const done = items.filter(({ q: gq }) => statusOf(answers[gq.id]) !== 'todo').length;
    const matches = needle ? items.filter(({ q: gq }) => fold(gq.text).includes(needle)) : items;
    return { g, items, done, matches };
  });

  const phaseLabel = phase === 'business' ? 'nghiệp vụ' : 'giao diện';

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar danh sách câu hỏi */}
      <aside className={sidebar ? 'lg:w-80 lg:shrink-0' : 'lg:w-12 lg:shrink-0'}>
        <div className="rounded-2xl border border-line bg-white shadow-sm lg:sticky lg:top-4">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
            onClick={() => setSidebar((s) => !s)}
            aria-expanded={sidebar}
            title={sidebar ? 'Thu gọn' : 'Mở danh sách câu hỏi'}
          >
            {sidebar ? <span>Danh sách câu hỏi</span> : <span className="lg:hidden">Danh sách câu hỏi</span>}
            <span className="text-muted">{sidebar ? '«' : '»'}</span>
          </button>
          {sidebar && (
            <>
              <div className="flex gap-3 border-t border-line px-4 py-2 text-xs text-muted">
                <span><b className="text-emerald-700">{counts.answered}</b> đã trả lời</span>
                <span><b className="text-amber-700">{counts.skipped}</b> bỏ qua</span>
                <span><b>{counts.todo}</b> chưa làm</span>
              </div>
              <div className="border-t border-line px-3 py-2">
                <label className="sr-only" htmlFor="qsearch">Tìm câu hỏi</label>
                <input
                  id="qsearch"
                  type="search"
                  className="input py-1.5 text-sm"
                  placeholder="Tìm câu hỏi…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <nav className="max-h-[60vh] overflow-y-auto border-t border-line py-2 lg:max-h-[calc(100vh-17rem)]">
                {groups.map(({ g, items, done, matches }) => {
                  if (items.length === 0) {
                    // Cả nhóm bị ẩn do rẽ nhánh
                    return needle ? null : (
                      <p key={g.id} className="px-4 py-1.5 text-xs text-stone-300" title="Khách không chọn phần này">
                        {g.title} · không áp dụng
                      </p>
                    );
                  }
                  if (needle && matches.length === 0) return null;
                  const open = Boolean(needle) || openGroups.has(g.id);
                  const complete = done === items.length;
                  return (
                    <div key={g.id} className="px-2 py-0.5">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-stone-50"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(g.id)) next.delete(g.id);
                            else next.add(g.id);
                            return next;
                          })
                        }
                      >
                        <span className="w-3 text-xs text-muted">{open ? '▾' : '▸'}</span>
                        <span className={['min-w-0 flex-1 truncate text-xs font-semibold tracking-wide uppercase', g.followup ? 'text-sky-700' : 'text-muted'].join(' ')}>
                          {g.followup && 'Bổ sung · '}
                          {g.title}
                        </span>
                        <span className={['shrink-0 text-xs tabular-nums', complete ? 'text-emerald-700' : 'text-muted'].join(' ')}>
                          {done}/{items.length}
                        </span>
                      </button>
                      {open &&
                        matches.map(({ q: gq, i }) => (
                          <button
                            key={gq.id}
                            type="button"
                            onClick={() => go(i)}
                            className={[
                              'flex w-full items-start gap-2 rounded-lg py-1.5 pr-2 pl-7 text-left text-sm',
                              i === index ? 'bg-brand-soft text-brand-dark' : 'hover:bg-stone-50',
                            ].join(' ')}
                          >
                            <StatusIcon status={statusOf(answers[gq.id])} />
                            <span className="line-clamp-2">
                              <span className="text-muted">{visibleList.findIndex((x) => x.id === gq.id) + 1}.</span> {gq.text}
                            </span>
                            {notes[gq.id]?.trim() && (
                              <span className="ml-auto shrink-0 text-xs text-sky-600" title="Có ghi chú BA">✎</span>
                            )}
                          </button>
                        ))}
                    </div>
                  );
                })}
                {needle && groups.every(({ matches }) => matches.length === 0) && (
                  <p className="px-4 py-2 text-sm text-muted">Không có câu hỏi nào khớp.</p>
                )}
              </nav>
            </>
          )}
        </div>
      </aside>

      {/* Thẻ câu hỏi */}
      <section className="min-w-0 flex-1">
        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} onClose={() => setError('')} />
          </div>
        )}
        <div className="mx-auto max-w-2xl">
          {q.followup && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <span className="min-w-0 flex-1">
                <b>Vòng câu hỏi bổ sung</b> — AI đã rà câu trả lời và cần làm rõ {followupList.length} điểm. Câu bỏ qua sẽ vào mục 13.9 (vấn đề mở).
              </span>
              <button type="button" className="btn-outline bg-white py-1.5 text-sm" disabled={finishing} onClick={() => void finish('srs')}>
                Bỏ qua vòng này, tạo SRS luôn
              </button>
            </div>
          )}
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-brand transition-all" style={{ width: `${(position / visibleList.length) * 100}%` }} />
          </div>
          <article key={q.id} className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className={['rounded-full px-3 py-1 font-medium', q.followup ? 'bg-sky-100 text-sky-800' : 'bg-stone-100 text-stone-700'].join(' ')}>
                {q.followup && 'Bổ sung · '}
                {q.groupTitle}
              </span>
              <span className="font-medium text-muted tabular-nums">
                Câu {position} / {visibleList.length}
              </span>
            </div>
            <h2 className="mt-5 text-xl leading-snug font-semibold sm:text-2xl">{q.text}</h2>
            {q.hint && <p className="mt-2 text-sm text-stone-400">{q.hint}</p>}
            {q.reason && (
              <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
                <span className="font-medium">Vì sao hỏi (chỉ BA thấy):</span> {q.reason}
              </p>
            )}
            {a?.status === 'skipped' && (
              <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1 text-sm text-amber-800">
                Đã đánh dấu “Chưa rõ” — sẽ ghi [CẦN XÁC NHẬN] trong SRS. Nhập câu trả lời để bỏ đánh dấu.
              </p>
            )}

            <div className="mt-6">
              <AnswerInput q={q} answer={a} onChange={setAnswer} />
            </div>

            {/* Ghi chú BA — thu gọn, không bắt buộc */}
            <div className="mt-5 border-t border-dashed border-line pt-3">
              <button
                type="button"
                className="text-sm font-medium text-stone-500 hover:text-stone-800"
                aria-expanded={noteOpen}
                onClick={() => setNoteOpen((o) => !o)}
              >
                {noteOpen ? '▾' : '▸'} Ghi chú BA{notes[q.id]?.trim() ? ' (đã có)' : ''}
              </button>
              {noteOpen && (
                <>
                  <textarea
                    rows={3}
                    className="input mt-2 resize-y text-sm"
                    placeholder="Nhận xét riêng của BA, ví dụ: khách còn phân vân, cần hỏi lại kế toán trưởng…"
                    value={notes[q.id] ?? ''}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted">Ghi chú nội bộ: AI dùng để đánh dấu chỗ cần xác nhận, không đưa vào gói gửi khách.</p>
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-outline" disabled={prevIndex < 0} onClick={() => go(prevIndex)}>
                ← Câu trước
              </button>
              <button type="button" className="btn-ghost text-amber-700 hover:bg-amber-50" onClick={skip}>
                Chưa rõ / Bỏ qua
              </button>
              <span className="flex-1" />
              <span className="text-xs text-muted" aria-live="polite">
                {saved === 'saving' ? 'Đang lưu…' : saved === 'saved' ? 'Đã lưu' : ''}
              </span>
              {isLast ? (
                <button type="button" className="btn-primary px-6 py-2.5 text-base" disabled={finishing} onClick={() => setConfirm(true)}>
                  {finishing ? 'Đang gửi…' : 'Kết thúc ✓'}
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => go(nextIndex)}>
                  Câu tiếp →
                </button>
              )}
            </div>
          </article>
          <p className="mt-3 text-center text-xs text-muted">Phục vụ mục SRS: {q.srsSections.join(', ')}</p>
        </div>
      </section>

      <ConfirmDialog
        open={confirm}
        title={`Kết thúc phần câu hỏi ${phaseLabel}?`}
        confirmLabel={followupDone ? (phase === 'business' ? 'Tạo SRS nghiệp vụ' : 'Bổ sung SRS giao diện') : 'Rà soát & hỏi bổ sung'}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void finish(followupDone ? 'srs' : 'followup')}
        secondaryLabel={followupDone ? undefined : 'Bỏ qua, tạo SRS luôn'}
        onSecondary={followupDone ? undefined : () => void finish('srs')}
      >
        <p>
          Đã trả lời <b>{counts.answered}</b> / {visibleList.length} câu
          {questions.length > visibleList.length && (
            <span className="text-muted"> ({questions.length - visibleList.length} câu không áp dụng do rẽ nhánh)</span>
          )}
          .
        </p>
        {counts.skipped + counts.todo > 0 ? (
          <p className="mt-2">
            Còn <b className="text-amber-700">{counts.skipped + counts.todo} câu</b> bỏ qua hoặc chưa trả lời. Những câu này sẽ được
            ghi <span className="tag-confirm">[CẦN XÁC NHẬN]</span> trong SRS để bạn hỏi lại khách hàng sau.
          </p>
        ) : (
          <p className="mt-2">Tất cả câu hỏi đã có câu trả lời.</p>
        )}
        {followupDone ? (
          <p className="mt-2">AI sẽ mất vài phút để viết tài liệu.</p>
        ) : (
          <p className="mt-2">
            <b>Khuyên dùng:</b> AI rà toàn bộ câu trả lời, tìm chỗ thiếu, mơ hồ hoặc mâu thuẫn và đặt tối đa 15 câu hỏi bổ sung. Bạn
            vẫn có thể bỏ qua vòng này để tạo SRS luôn.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === 'answered') return <span className="mt-0.5 text-emerald-600" aria-label="Đã trả lời">✓</span>;
  if (status === 'skipped') return <span className="mt-0.5 text-amber-600" aria-label="Bỏ qua">!</span>;
  return <span className="mt-0.5 text-stone-300" aria-label="Chưa làm">○</span>;
}

/** Khung trả lời theo loại câu hỏi; câu single/multi luôn có lựa chọn "Khác" kèm ô nhập. */
function AnswerInput({ q, answer, onChange }: { q: FlatQuestion; answer: Answer | undefined; onChange: (a: Answer) => void }) {
  const other = answer?.other ?? '';
  if (q.type === 'text') {
    return (
      <textarea
        autoFocus
        rows={5}
        className="input resize-y"
        placeholder="Nhập câu trả lời của khách hàng…"
        value={typeof answer?.value === 'string' ? answer.value : ''}
        onChange={(e) => onChange({ status: 'answered', value: e.target.value })}
      />
    );
  }

  const selected: string[] = Array.isArray(answer?.value) ? answer.value : answer?.value ? [answer.value] : [];
  const multi = q.type === 'multi';
  const toggle = (opt: string) => {
    let next: string[];
    if (multi) next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    else next = [opt];
    onChange({ status: 'answered', value: multi ? next : next[0], other: next.includes(OTHER) ? other : '' });
  };
  const options = [...q.options, OTHER];

  return (
    <fieldset>
      <legend className="sr-only">{q.text}</legend>
      <p className="mb-3 text-xs text-muted">{multi ? 'Có thể chọn nhiều đáp án' : 'Chọn một đáp án'}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={[
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition',
                checked ? 'border-brand bg-brand-soft/50 ring-1 ring-brand' : 'border-line hover:border-stone-300',
              ].join(' ')}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={q.id}
                className="size-4 accent-brand"
                checked={checked}
                onChange={() => toggle(opt)}
              />
              {opt === OTHER ? 'Khác' : opt}
            </label>
          );
        })}
      </div>
      {selected.includes(OTHER) && (
        <input
          autoFocus
          className="input mt-3"
          placeholder="Ghi rõ câu trả lời khác…"
          value={other}
          onChange={(e) => onChange({ status: 'answered', value: multi ? selected : OTHER, other: e.target.value })}
        />
      )}
    </fieldset>
  );
}
