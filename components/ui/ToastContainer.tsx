import React, { useState, useEffect } from 'react';
import { toast } from '../../services/toastService';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none outline-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-slate-200 bg-white p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-right-full md:max-w-[350px]"
        >
            <div className="flex gap-3 items-center">
                {t.type === 'success' && <div className="text-emerald-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>}
                {t.type === 'error' && <div className="text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>}
                {t.type === 'info' && <div className="text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>}
                
                <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none text-slate-950">
                        {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : 'Notification'}
                    </p>
                    <p className="text-sm text-slate-500 opacity-90">{t.message}</p>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};