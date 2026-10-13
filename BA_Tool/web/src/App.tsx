// Điều phối màn hình. URL dạng #/p/<slug> để tải lại trang vẫn mở đúng dự án.
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { AccountBadge, ApiKeyWarning, AuthSetupScreen } from './components/AuthGate';
import { ErrorBanner } from './components/ConfirmDialog';
import { JobProgress } from './components/JobProgress';
import { ProgressBar } from './components/ProgressBar';
import { ProjectList } from './screens/ProjectList';
import { PrototypeScreen } from './screens/PrototypeScreen';
import { QAScreen } from './screens/QAScreen';
import { RequestScreen } from './screens/RequestScreen';
import { SrsScreen } from './screens/SrsScreen';
import { SCREEN_LABELS, projectTypeLabel, stepOf, type AuthStatus, type JobKind, type Project, type Screen } from './types';

const readSlug = () => /^#\/p\/([a-z0-9-]+)/.exec(window.location.hash)?.[1] ?? null;

const JOB_TITLES: Record<JobKind, string> = {
  'business-questions': 'AI đang soạn bộ câu hỏi nghiệp vụ',
  'business-followup': 'AI đang rà soát câu trả lời nghiệp vụ',
  'ui-followup': 'AI đang rà soát câu trả lời giao diện',
  'business-srs': 'AI đang viết SRS nghiệp vụ',
  'ui-questions': 'AI đang soạn bộ câu hỏi giao diện',
  'ui-srs': 'AI đang bổ sung SRS giao diện',
  prototype: 'AI đang dựng prototype',
};

export default function App() {
  const [slug, setSlug] = useState<string | null>(readSlug);
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const onHash = () => setSlug(readSlug());
    window.addEventListener('hashchange', onHash);
    api.authStatus().then(setAuth).catch((e: Error) => setAuthError(e.message));
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const open = (s: string | null) => {
    window.location.hash = s ? `#/p/${s}` : '';
    setSlug(s);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => open(null)} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm text-white">BA</span>
            SRS & Prototype Builder
          </button>
          <span className="flex-1" />
          {auth && <AccountBadge status={auth} />}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {authError && <ErrorBanner message={authError} />}
        {auth?.envApiKey && (
          <div className="mb-6">
            <ApiKeyWarning />
          </div>
        )}
        {auth === null && !authError ? (
          <p className="text-muted">Đang kiểm tra Claude Code trên máy…</p>
        ) : auth && !auth.ready ? (
          <AuthSetupScreen status={auth} onChange={setAuth} />
        ) : slug ? (
          <ProjectView key={slug} slug={slug} onHome={() => open(null)} />
        ) : (
          <ProjectList onOpen={open} />
        )}
      </main>
    </div>
  );
}

function ProjectView({ slug, onHome }: { slug: string; onHome: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [jobError, setJobError] = useState('');
  /** Màn hình đang xem (có thể lùi lại bước trước mà không đổi tiến độ) */
  const [view, setView] = useState<Screen | null>(null);

  const reload = useCallback(async () => {
    try {
      const p = await api.getProject(slug);
      setProject(p);
      setView(null);
      if (p.job?.status === 'error') setJobError(p.job.error || 'Tác vụ AI thất bại');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);
  useEffect(() => void reload(), [reload]);

  if (error) return <ErrorBanner message={error} onRetry={() => void reload()} />;
  if (!project) return <p className="text-muted">Đang tải dự án…</p>;

  const screen = view ?? project.screen;
  const running = project.job?.status === 'running' ? project.job : null;
  const reached = stepOf(project.screen);

  const run = async (fn: () => Promise<{ jobId: string }>) => {
    setJobError('');
    try {
      await fn();
    } catch (e) {
      setJobError((e as Error).message);
    }
    await reload();
  };
  const startJob = (kind: JobKind, targetDir?: string) => run(() => api.startJob(slug, kind, targetDir));
  const goScreen = async (s: Screen) => {
    try {
      setProject(await api.setScreen(slug, s));
      setView(null);
    } catch (e) {
      setJobError((e as Error).message);
    }
  };

  // Bấm vào bước đã qua trên thanh tiến trình → xem lại (không đổi tiến độ)
  const selectStep = (step: number) => {
    // Bước đã hoàn thành thì xem lại màn SRS của bước đó
    const target: Screen[] = ['business-review', 'ui-review', 'prototype', 'done'];
    setView(step === reached ? null : target[step]);
  };

  // "Chạy lại bước này": chạy lại đúng tác vụ lỗi gần nhất (kể cả prototype — server nhớ folder đích)
  const failed = project.job?.status === 'error' ? project.job : null;
  const canRetry = failed && (failed.kind !== 'prototype' || failed.targetDir);
  const usageLimit = failed?.errorCode === 'usage_limit';

  let body;
  if (running) {
    body = (
      <JobProgress
        jobId={running.id}
        title={JOB_TITLES[running.kind]}
        onDone={() => void reload()}
        onError={(m) => {
          setJobError(m);
          void reload();
        }}
      />
    );
  } else {
    switch (screen) {
      case 'request':
        body = <RequestScreen initial={project.request} onSubmit={(t) => run(() => api.submitRequest(slug, t))} />;
        break;
      case 'business-qa':
        body = (
          <QAScreen
            project={project}
            phase="business"
            onFinish={(mode) => startJob(mode === 'followup' ? 'business-followup' : 'business-srs')}
          />
        );
        break;
      case 'ui-qa':
        body = (
          <QAScreen project={project} phase="ui" onFinish={(mode) => startJob(mode === 'followup' ? 'ui-followup' : 'ui-srs')} />
        );
        break;
      case 'business-review':
        body = (
          <SrsScreen
            project={project}
            showChanges={project.screen === 'business-review'}
            actions={
              <button
                type="button"
                className="btn-primary"
                onClick={() => (project.ui.questions ? void goScreen('ui-qa') : void startJob('ui-questions'))}
              >
                Sang bước Giao diện →
              </button>
            }
          />
        );
        break;
      case 'ui-review':
        body = (
          <SrsScreen
            project={project}
            showChanges={project.screen === 'ui-review'}
            actions={
              <button type="button" className="btn-primary" onClick={() => void goScreen('prototype')}>
                Sang bước Dựng prototype →
              </button>
            }
          />
        );
        break;
      case 'prototype':
      case 'done':
        body = (
          <PrototypeScreen
            project={project}
            error=""
            onClearError={() => setJobError('')}
            onBuild={(dir) => startJob('prototype', dir)}
          />
        );
        break;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" className="btn-ghost -ml-3 px-3" onClick={onHome}>
          ← Dự án
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted">{projectTypeLabel(project.projectType)} · {SCREEN_LABELS[screen]}{view && ' (đang xem lại)'}</p>
        </div>
        <span className="flex-1" />
        <ProgressBar current={stepOf(screen)} reached={reached} onSelect={running ? undefined : selectStep} />
      </div>

      {jobError && (
        <ErrorBanner
          tone={usageLimit ? 'warning' : 'error'}
          title={usageLimit ? 'Đã chạm giới hạn sử dụng' : undefined}
          message={
            usageLimit
              ? `${jobError} Câu trả lời và tiến độ của dự án vẫn được giữ nguyên.`
              : jobError
          }
          retryLabel="Chạy lại bước này"
          onRetry={canRetry ? () => void run(() => api.retryJob(slug)) : undefined}
          onClose={() => {
            setJobError('');
            // Xóa luôn lỗi đã lưu trong project.json để tải lại trang không hiện lại
            api.setScreen(slug, project.screen).catch(() => {});
          }}
        />
      )}
      {view && (
        <p className="rounded-xl bg-sky-50 px-4 py-2 text-sm text-sky-800">
          Bạn đang xem lại bước trước.{' '}
          <button type="button" className="font-semibold underline" onClick={() => setView(null)}>
            Quay về bước hiện tại
          </button>
        </p>
      )}
      {body}
    </div>
  );
}
