import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('trb_current_customer_v1');
    } catch {
      // Ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0e0c] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-neutral-950 border border-[#F25C05] p-8 shadow-[0_20px_50px_rgba(242,92,5,0.2)]">
            <div className="w-12 h-12 mx-auto mb-4 border border-[#F25C05] flex items-center justify-center text-[#F25C05]">
              !
            </div>
            <h2 className="text-lg font-light tracking-[0.2em] uppercase text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-neutral-400 font-light mb-6 leading-relaxed">
              An unexpected render error occurred. Click below to refresh the storefront and restore all controls.
            </p>
            {this.state.error && (
              <div className="p-3 bg-black/60 border border-white/10 text-[11px] text-rose-400 text-left font-mono overflow-auto max-h-32 mb-6">
                {(this.state.error as any).message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#F25C05] hover:bg-[#ff6811] text-white text-xs tracking-[0.2em] uppercase font-medium transition-all cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
