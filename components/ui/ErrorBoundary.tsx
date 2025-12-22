
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { t } from '../../services/i18n';
import { dbFacade } from '../../services/dbFacade';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  viewName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleWipeRecovery = async () => {
      if (confirm(t('recoveryConfirm', 'common'))) {
          try {
              await dbFacade.clearAllData();
              window.location.reload();
          } catch (e) {
              alert(t('recoveryFailed', 'common'));
          }
      }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-50 p-6 border-b border-red-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h2 className="text-xl font-bold text-red-900 mb-1">
                {t('error', 'common')}
              </h2>
              <p className="text-sm text-red-700/80">
                Lumina encountered a critical error in the {this.props.viewName || 'Application'}.
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-100 rounded-lg p-3 mb-6 overflow-auto max-h-32 border border-slate-200">
                <p className="font-mono text-xs text-slate-600 break-words">
                  {this.state.error?.message || "Unknown error occurred."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={this.handleReset}
                  className="shadcn-btn shadcn-btn-primary w-full h-11 text-sm font-bold uppercase tracking-wide"
                >
                  {t('returnDashboard', 'common')}
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="shadcn-btn shadcn-btn-outline w-full h-11 text-xs text-slate-500 hover:text-slate-900"
                >
                  {t('reloadApp', 'common')}
                </button>
                <div className="h-px bg-slate-200 my-2"></div>
                <button 
                  onClick={this.handleWipeRecovery}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest text-center"
                >
                  {t('wipeRecoveryBtn', 'common')}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
