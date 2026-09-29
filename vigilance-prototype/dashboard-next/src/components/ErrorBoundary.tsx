'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] rounded-xl border border-red-500/30 bg-black/60 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">
            {this.props.fallbackTitle || 'Component Render Issue'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected rendering error occurred. Hardware acceleration or WebGL might be unavailable.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
