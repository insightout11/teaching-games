'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  moduleName: string;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary around GameShell / ActivityShell.
 * Catches rendering crashes and shows a recovery UI instead of a white screen.
 * Teacher can click "Try Again" (remounts the module) or "Switch Activity" (returns to grid).
 */
export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ModuleErrorBoundary] ${this.props.moduleName} crashed:`, error, info.componentStack);
  }

  // Reset when a different module is mounted
  componentDidUpdate(prevProps: Props) {
    if (prevProps.moduleName !== this.props.moduleName) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h3>
          <p className="text-sm opacity-60 mb-6 max-w-md">
            {this.props.moduleName} encountered an error. Your session data and leaderboard are safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
            <button
              onClick={this.props.onReset}
              className="px-4 py-2 rounded-lg glass border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Switch Activity
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 text-xs text-left bg-black/40 rounded-lg p-4 max-w-full overflow-x-auto opacity-60">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
