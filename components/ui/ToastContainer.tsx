
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
      // Auto remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    });
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300
            ${
              t.type === 'success' ? 'bg-emerald-100 border-emerald-200 text-emerald-900 font-bold' :
              t.type === 'error' ? 'bg-rose-100 border-rose-200 text-rose-900 font-bold' :
              'bg-slate-800 border-slate-700 text-white font-medium'
            }
          `}
        >
          <div className="flex items-center gap-3">
             {t.type === 'success' && <span className="text-emerald-600 bg-emerald-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">✔</span>}
             {t.type === 'error' && <span className="text-rose-600 bg-rose-200 rounded-full w-5 h-5 flex items-center justify-center text-xs">✖</span>}
             {t.type === 'info' && <span className="text-slate-400">ℹ</span>}
             <span className="text-sm">{t.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
