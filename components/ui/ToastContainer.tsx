import React, { useState, useEffect } from 'react';
import { toast } from '../../services/toastService';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
  }, []);

  // z-index increased to 11000 to be above tutorial (10000)
  return (
    <div className="fixed bottom-6 right-6 z-[11000] flex flex-col gap-3 pointer-events-none outline-none max-w-[400px] w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-md p-4 pr-6 shadow-xl transition-all animate-in slide-in-from-right-full duration-300 ring-1 ring-black/5 dark:ring-white/5"
        >
            <div className="flex gap-4 items-center">
                <div className={`p-2 rounded-full shrink-0 ${
                    t.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    t.type === 'error' ? 'bg-red-500/10 text-red-500' :
                    t.type === 'loading' ? 'bg-primary/10 text-primary' :
                    'bg-slate-500/10 text-slate-500'
                }`}>
                    {t.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                    {t.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                    {t.type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
                    {t.type === 'loading' && <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}
                </div>
                
                <div className="grid gap-1">
                    <p className="text-sm font-bold leading-none text-foreground tracking-tight">
                        {t.type === 'success' ? 'Success' : t.type === 'error' ? 'Error' : t.type === 'loading' ? 'Processing' : 'Note'}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{t.message}</p>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};