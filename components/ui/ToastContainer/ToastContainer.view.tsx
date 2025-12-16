
import React from 'react';
import { t } from '../../../services/i18n';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
}

interface ToastContainerViewProps {
  toasts: ToastItem[];
}

export const ToastContainerView: React.FC<ToastContainerViewProps> = ({ toasts }) => {
  const getTitle = (type: ToastItem['type']): string => {
      switch (type) {
          case 'success': return t('toastSuccess', 'common');
          case 'error': return t('toastError', 'common');
          case 'loading': return t('toastProcessing', 'common');
          default: return t('toastNotification', 'common');
      }
  };

  const getIcon = (type: ToastItem['type']) => {
      if (type === 'success') return <div className="text-emerald-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>;
      if (type === 'error') return <div className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>;
      if (type === 'info') return <div className="text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>;
      if (type === 'loading') return <div className="text-indigo-500 animate-spin"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>;
      return null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-right-full md:max-w-[350px]">
            <div className="flex gap-3 items-center">
                {getIcon(t.type)}
                <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none text-slate-950">{getTitle(t.type)}</p>
                    <p className="text-sm text-slate-500 opacity-90">{t.message}</p>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};
