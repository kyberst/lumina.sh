
import React from 'react';
import { t } from '../../../../services/i18n';

interface ErrorOverlayProps {
    logs: any[];
    onFix: (errors: any[]) => void;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ logs, onFix }) => {
    const errorLogs = logs.filter(l => l.type === 'error');
    
    return (
        <div className="absolute inset-x-4 bottom-4 z-40 bg-red-600/95 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 backdrop-blur-sm border border-white/20">
            <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {t('errorOverlayTitle', 'builder')}
                </h3>
                <p className="text-sm opacity-80 mt-1">{t('errorOverlayDesc', 'builder')}</p>
            </div>
            <button 
                onClick={() => onFix(errorLogs)}
                className="bg-white text-red-600 font-bold px-5 py-3 rounded-lg shadow-md hover:bg-red-50 transition-all flex items-center gap-2 shrink-0 ml-4 hover:scale-105 active:scale-100"
            >
                {t('errorOverlayButton', 'builder')}
            </button>
        </div>
    );
};