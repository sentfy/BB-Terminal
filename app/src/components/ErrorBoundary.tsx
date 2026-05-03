import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div className="text-[12px] text-term-red uppercase tracking-wider font-bold">RENDER ERROR</div>
          <div className="text-[11px] text-term-muted text-center max-w-md">
            {this.props.label && <span className="text-term-heading">{this.props.label}: </span>}
            {this.state.error?.message ?? "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-[10px] px-3 py-1 border border-term-amber text-term-amber hover:bg-term-amberSubtle uppercase tracking-wider mt-2"
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
