
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { t } from '../../services/i18n';
import { logger } from '../../services/logger';
import { AppModule } from '../../types';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    logger.error(AppModule.CORE, `ErrorBoundary caught an error: ${error.message}`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    // Instead of reloading, reset the error state to allow React to retry rendering.
    // This preserves application state like the current user session.
    this.setState({ hasError: false, error: undefined });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('errorOverlayTitle', 'builder')}</h1>
            <p className="text-slate-500 mt-2">{t('errorOverlayDesc', 'builder')}</p>
            <button
              onClick={this.handleReset}
              className="mt-6 shadcn-btn shadcn-btn-primary w-full"
            >
              {t('tryAgain', 'common')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
