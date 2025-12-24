
import React, { useState, useEffect } from 'react';
import { dialogService } from '../../services/dialogService';

export const DialogContainer: React.FC = () => {
  const [dialog, setDialog] = useState<any | null>(null);

  useEffect(() => {
    return dialogService.subscribe(setDialog);
  }, []);

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={dialog.onCancel}
      ></div>

      {/* Dialog Content */}
      <div className="relative z-[210] grid w-full max-w-lg gap-6 border border-border bg-card p-6 shadow-2xl rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 sm:rounded-2xl md:w-full ring-1 ring-white/10">
        <div className="flex flex-col space-y-2 text-center sm:text-left">
          <h2 className="text-xl font-bold leading-none tracking-tight text-foreground flex items-center gap-2 justify-center sm:justify-start">
            {dialog.destructive && <span className="text-destructive">⚠️</span>}
            {dialog.title}
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            {dialog.description}
          </div>
        </div>
        
        {!dialog.hideButtons && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-3 sm:gap-0">
                {dialog.type !== 'alert' && (
                    <button 
                        onClick={dialog.onCancel}
                        className="shadcn-btn shadcn-btn-ghost font-bold"
                    >
                        {dialog.cancelLabel || 'Cancel'}
                    </button>
                )}
                <button 
                    onClick={() => dialog.onConfirm()}
                    className={`shadcn-btn px-6 shadow-lg ${dialog.destructive ? 'shadcn-btn-destructive' : 'shadcn-btn-primary'}`}
                >
                    {dialog.confirmLabel || 'Confirm'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
