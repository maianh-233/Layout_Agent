import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/** Bắt lỗi render để không hiện trang trắng. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-red-800">Giao diện gặp lỗi</h1>
        <p className="mt-2 text-sm text-stone-600">Dữ liệu dự án vẫn được lưu trên máy. Tải lại trang để tiếp tục.</p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-100 p-3 text-xs">{this.state.error.message}</pre>
        <button type="button" className="btn-primary mt-4" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
