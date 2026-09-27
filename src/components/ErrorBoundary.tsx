import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Campus Pulse ErrorBoundary]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-rose-50/80 border-2 border-rose-500/30 text-[#111111] font-mono">
          <div className="flex items-center gap-3 mb-3 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-syne font-bold text-lg uppercase tracking-tight">
              {this.props.fallbackTitle || 'Interactive Module Notice'}
            </h3>
          </div>
          <p className="text-xs text-[#666660] mb-4">
            {this.props.fallbackMessage || 'This section encountered an unexpected error, but the rest of Campus Pulse remains fully functional.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-xs font-bold uppercase hover:bg-rose-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
