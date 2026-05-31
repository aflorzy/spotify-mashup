import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full flex flex-col gap-4 text-center">
            <h2 className="text-white font-bold text-lg">Something went wrong</h2>
            <p className="text-gray-400 text-sm break-words">{this.state.error.message}</p>
            <div className="flex flex-col gap-2">
              <button
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-2 rounded-lg transition-colors"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
              <button
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-lg transition-colors"
                onClick={() => { window.location.href = '/'; }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
