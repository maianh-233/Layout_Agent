// Gọi API backend. Mọi lỗi được chuyển thành Error có thông báo tiếng Việt.
import type { Answer, AuthStatus, DirListing, JobKind, Phase, Project, ProjectType, Screen, SrsFileInfo } from './types';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new Error('Không kết nối được tới server của tool. Hãy kiểm tra `npm run dev` còn đang chạy.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Lỗi ${res.status}`);
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  authStatus: () => call<AuthStatus>('/api/auth-status'),
  recheckAuth: () => call<AuthStatus>('/api/auth-status/recheck', { method: 'POST' }),
  retryJob: (slug: string) => call<{ jobId: string }>(`/api/projects/${slug}/jobs/retry`, { method: 'POST' }),
  listProjects: () => call<Project[]>('/api/projects'),
  createProject: (name: string, projectType: ProjectType) =>
    call<Project>('/api/projects', json('POST', { name, projectType })),
  getProject: (slug: string) => call<Project>(`/api/projects/${slug}`),
  setScreen: (slug: string, screen: Screen) => call<Project>(`/api/projects/${slug}/screen`, json('POST', { screen })),
  submitRequest: (slug: string, request: string) =>
    call<{ jobId: string }>(`/api/projects/${slug}/request`, json('POST', { request })),
  startJob: (slug: string, kind: JobKind, targetDir?: string) =>
    call<{ jobId: string }>(`/api/projects/${slug}/jobs`, json('POST', { kind, targetDir })),
  saveAnswers: (slug: string, phase: Phase, answers: Record<string, Answer>, currentIndex: number) =>
    call<{ ok: true }>(`/api/projects/${slug}/answers/${phase}`, json('PUT', { answers, currentIndex })),
  listSrs: (slug: string) => call<SrsFileInfo[]>(`/api/projects/${slug}/srs`),
  readSrs: (slug: string, path: string) =>
    call<{ content: string }>(`/api/projects/${slug}/srs/file?path=${encodeURIComponent(path)}`),
  writeSrs: (slug: string, path: string, content: string) =>
    call<{ ok: true }>(`/api/projects/${slug}/srs/file`, json('PUT', { path, content })),
  listDir: (path?: string) => call<DirListing>(`/api/fs/list${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  mkdir: (parent: string, name: string) => call<{ path: string }>('/api/fs/mkdir', json('POST', { parent, name })),
  checkDir: (path: string) =>
    call<{ ok: boolean; entryCount: number; error?: string }>(`/api/fs/check?path=${encodeURIComponent(path)}`),
};
