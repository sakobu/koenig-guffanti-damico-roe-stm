import { Component, type ErrorInfo, type ReactNode } from 'react';

import { RefreshCw } from 'lucide-react';

import Button from '../controls/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  showRetry?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { name, onError } = this.props;

    console.error(
      `[ErrorBoundary${name ? `: ${name}` : ''}] Caught error:`,
      error
    );
    console.error('Component stack:', errorInfo.componentStack);

    onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, name, showRetry = true } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/80 rounded-lg border border-zinc-700">
          <div className="text-red-400 text-sm font-medium mb-2">
            {name ? `${name} Error` : 'Something went wrong'}
          </div>
          <p className="text-zinc-400 text-xs text-center mb-4 max-w-xs">
            {error?.message || 'An unexpected error occurred'}
          </p>
          {showRetry && (
            <Button variant="secondary" size="sm" onClick={this.handleRetry}>
              <RefreshCw size={14} className="mr-2" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return children;
  }
}
