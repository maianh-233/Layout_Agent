// Màn hình 2 / 4 — Trả lời câu hỏi, mỗi lần một câu. Tự lưu khi chuyển câu.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { ConfirmDialog, ErrorBanner } from '../components/ConfirmDialog';
import { OTHER, flatten, hasContent, type Answer, type FlatQuestion, type Phase, type Project } from '../types';

interface Props {
  project: Project;
  phase: Phase;
  onFinish: () => Promise<void>;
}

type Status = 'answered' | 'skipped' | 'todo';

function statusOf(a: Answer | undefined): Status {
  if (a?.status === 'skipped') return 'skipped';
  return hasContent(a) ? 'answered' : 'todo';
}

export function QAScreen({ project, phase, onFinish }: Props) {
  const state = project[phase];
  const questions = useMemo(() => flatten(state.questions), [state.questions]);
  const [answers, setAnswers] = useState<Record<string, Answer>>(state.answers);
  const [index, setIndex] = useState(Math.min(state.currentIndex, Math.max(questions.length - 1, 0)));
  const [sidebar, setSidebar] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [finishing, setFinishing] = useState(false);

  // Lưu lên server. Dùng ref để luôn gửi bản mới nhất.
  const latest = useRef({ answers, index });
  latest.current = { answers, index };
  const save = useCallback(async () => {
    setSaved('saving');
    try {
      await api.saveAnswers(project.slug, phase, latest.current.answers, latest.current.index);
      setSaved('saved');
    } catch (e) {
      setError((e as Error).message);
      setSaved('idle');
    }
  }, [project.slug, phase]);

  // Tự lưu sau mỗi lần chuyển câu, và 1,5 giây sau khi ngừng gõ
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => void save(), 1500);
    return () => clearTimeout(t);
  }, [answers, save]);
  const go = (i: number) => {
    latest.current.index = i;
    setIndex(i);
    void save();
  };

  if (questions.length === 0) return <p className="text-muted">Chưa có câu hỏi.</p>;

  const q = questions[index];
  const a = answers[q.id];
  const isLast = index === questions.length - 1;
  const counts = questions.reduce(
    (c, x) => {
      c[statusOf(answers[x.id])]++;
      return c;
    },
    { answered: 0, skipped: 0, todo: 0 } as Record<Status, number>,
  );

  const setAnswer = (next: Answer) => setAnswers((prev) => ({ ...prev, [q.id]: next }));

  const skip = () => {
    setAnswers((prev) => ({ ...prev, [q.id]: { status: 'skipped', value: prev[q.id]?.value ?? '', other: prev[q.id]?.other } }));
    if (!isLast) go(index + 1);
    else void save();
  };

  const finish = async () => {
    setConfirm(false);
    setFinishing(true);
    try {
      await save();
      await onFinish();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar danh sách câu hỏi */}
      <aside className={sidebar ? 'lg:w-72 lg:shrink-0' : 'lg:w-12 lg:shrink-0'}>
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
              <nav className="max-h-[60vh] overflow-y-auto border-t border-line py-2 lg:max-h-[calc(100vh-14rem)]">
                {state.questions!.groups.map((g) => (
                  <div key={g.id} className="px-2 py-1">
                    <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase">{g.title}</p>
                    {g.questions.map((gq) => {
                      const i = questions.findIndex((x) => x.id === gq.id);
                      const st = statusOf(answers[gq.id]);
                      return (
                        <button
                          key={gq.id}
                          type="button"
                          onClick={() => go(i)}
                          className={[
                            'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm',
                            i === index ? 'bg-brand-soft text-brand-dark' : 'hover:bg-stone-50',
                          ].join(' ')}
                        >
                          <StatusIcon status={st} />
                          <span className="line-clamp-2">
                            <span className="text-muted">{i + 1}.</span> {gq.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
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
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-brand transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <article key={q.id} className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">{q.groupTitle}</span>
              <span className="font-medium text-muted tabular-nums">
                Câu {index + 1} / {questions.length}
              </span>
            </div>
            <h2 className="mt-5 text-xl leading-snug font-semibold sm:text-2xl">{q.text}</h2>
            {q.hint && <p className="mt-2 text-sm text-stone-400">{q.hint}</p>}
            {a?.status === 'skipped' && (
              <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1 text-sm text-amber-800">
                Đã đánh dấu “Chưa rõ” — sẽ ghi [CẦN XÁC NHẬN] trong SRS. Nhập câu trả lời để bỏ đánh dấu.
              </p>
            )}

            <div className="mt-6">
              <AnswerInput q={q} answer={a} onChange={setAnswer} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" className="btn-outline" disabled={index === 0} onClick={() => go(index - 1)}>
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
                <button type="button" className="btn-primary" onClick={() => go(index + 1)}>
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
        title={phase === 'business' ? 'Kết thúc phần câu hỏi nghiệp vụ?' : 'Kết thúc phần câu hỏi giao diện?'}
        confirmLabel={phase === 'business' ? 'Tạo SRS nghiệp vụ' : 'Bổ sung SRS giao diện'}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void finish()}
      >
        <p>
          Đã trả lời <b>{counts.answered}</b> / {questions.length} câu.
        </p>
        {counts.skipped + counts.todo > 0 ? (
          <p className="mt-2">
            Còn <b className="text-amber-700">{counts.skipped + counts.todo} câu</b> bỏ qua hoặc chưa trả lời. Những câu này sẽ được
            ghi <span className="tag-confirm">[CẦN XÁC NHẬN]</span> trong SRS để bạn hỏi lại khách hàng sau.
          </p>
        ) : (
          <p className="mt-2">Tất cả câu hỏi đã có câu trả lời.</p>
        )}
        <p className="mt-2">AI sẽ mất vài phút để viết tài liệu.</p>
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
