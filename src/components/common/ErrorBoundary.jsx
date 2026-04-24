import { Component } from "react";

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f9f9] px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.1)] text-center">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              ⚠️ Something went wrong
            </h2>

            <p className="mb-4 text-sm text-gray-600">
              We&apos;re sorry, but an unexpected error occurred. Our team has
              been notified.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4 rounded-lg bg-gray-50 p-3 text-left text-xs text-gray-700">
                <summary className="cursor-pointer font-medium text-gray-800">
                  Error Details (Development Only)
                </summary>

                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>

                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-lg bg-[#0e6b67] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c5c59]"
              >
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;