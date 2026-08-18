import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error('Uncaught application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-4 py-10">
          <div className="max-w-xl rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Something went wrong</p>
            <h1 className="mt-4 text-3xl font-bold text-[var(--fg)]">Application error</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The page encountered an unexpected error. Refresh the page or come back in a moment.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null, info: null })}
              className="mt-6 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
