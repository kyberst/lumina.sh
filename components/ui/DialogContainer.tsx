import React, { useState, useEffect } from 'react';
import { dialogService } from '../../services/dialogService';

export const DialogContainer: React.FC = () => {
  const [dialog, setDialog] = useState<any | null>(null);

  useEffect(() => {
    return dialogService.subscribe(setDialog);
  }, []);

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={dialog.onCancel}
      ></div>

      {/* Dialog Content */}
      <div className="relative z-[160] grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg md:w-full animate-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-slate-900">
            {dialog.title}
          </h2>
          <div className="text-sm text-slate-500">
            {dialog.description}
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 mt-2">
            {dialog.type !== 'alert' && (
                <button 
                    onClick={dialog.onCancel}
                    className="shadcn-btn shadcn-btn-outline"
                >
                    {dialog.cancelLabel || 'Cancel'}
                </button>
            )}
            <button 
                onClick={() => dialog.onConfirm()}
                className={`shadcn-btn ${dialog.destructive ? 'shadcn-btn-destructive' : 'shadcn-btn-primary'}`}
            >
                {dialog.confirmLabel || 'Confirm'}
            </button>
        </div>
      </div>
    </div>
  );
};