
import React from 'react';
import { t } from '../../../../services/i18n';

interface Log {
    type: string;
    msg: string;
    time: string;
    source?: { file: string, line: number };
}

interface Props {
    logs: Log[];
    onClear: () => void;
    onClose: () => void;
    onNavigate?: (file: string, line: number) => void;
}

export const ConsolePanel: React.FC<Props> = ({ logs, onClear, onClose, onNavigate }) => {
    return (
        <div className="absolute bottom-16 right-4 w-96 max-h-[300px] bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 z-50 ring-1 ring-white/5">
            <div className="bg-white/5 p-2 flex justify-between items-center border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    {t('console.title', 'workspace')}
                </span>
                <div className="flex gap-1">
                    <button onClick={onClear} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors">{t('console.clear', 'workspace')}</button>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors text-lg leading-none">&times;</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5 custom-scrollbar">
                {logs.length === 0 && <div className="text-slate-600 italic p-4 text-center">{t('console.empty', 'workspace')}</div>}
                {logs.map((log, i) => (
                    <div key={i} className={`flex flex-col p-2 rounded-md border border-transparent hover:bg-white/5 transition-colors group ${log.type === 'error' ? 'bg-red-500/10 border-red-500/20' : ''}`}>
                        <div className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'}`}>
                            <span className="opacity-40 select-none whitespace-nowrap">{log.time}</span>
                            <span className="break-all">{log.msg}</span>
                        </div>
                        {log.source && onNavigate && (
                            <button 
                                onClick={() => onNavigate(log.source!.file, log.source!.line)}
                                className="self-end mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="underline decoration-indigo-400/30 underline-offset-2">{log.source.file}:{log.source.line}</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
