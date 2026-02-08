"use client";

import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);
    
    // In production, send to monitoring service
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // Example: Send to Sentry, Datadog, etc.
      // fetch("/api/errors", {
      //   method: "POST",
      //   body: JSON.stringify({ error: error.message, stack: errorInfo.componentStack })
      // });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error!, this.resetError);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Etwas ist schiefgelaufen</h3>
              <p className="text-sm text-red-600 mt-1">
                {this.state.error?.message || "Ein unerwarteter Fehler ist aufgetreten"}
              </p>
              <button
                onClick={this.resetError}
                className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  loading?: ReactNode;
  onError?: (error: Error) => ReactNode;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  state: AsyncErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Async error caught:", error);
    this.props.onError?.(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.onError?.(this.state.error!) || (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-red-700 text-sm">
            Fehler: {this.state.error?.message || "Unbekannt"}
          </p>
          <button 
            onClick={this.reset}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
