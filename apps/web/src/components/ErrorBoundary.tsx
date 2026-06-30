import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const message = this.state.error.message || 'Something went wrong rendering this page.';
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="card border-red-200 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-ink">This page hit a snag</h2>
              <p className="mt-1 text-[12px] text-ink-2">{message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={this.reset} className="btn btn-primary btn-sm">
                  <RotateCcw size={12} />
                  Try again
                </button>
                <a href="/" className="btn btn-outline btn-sm">
                  Go home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}