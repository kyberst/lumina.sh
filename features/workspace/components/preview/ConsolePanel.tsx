
import React from 'react';
import { t } from '../../../../services/i18n';
import { ConsoleLog } from '../../../../types';

interface Props {
    logs: ConsoleLog[];
    selectedLogs: ConsoleLog[];
    onToggleLog: (log: ConsoleLog) => void;
    onClose: () => void;
    onNavigate?: (file: string, line: number) => void;
}

export const ConsolePanel: React.FC<Props> = ({ logs, selectedLogs, onToggleLog, onClose, onNavigate }) => {
    return (
        <div className="absolute bottom-16 right-4 w-96 max-h-[300px] bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 z-50 ring-1 ring-white/5">
            <div className="bg-white/5 p-2 flex justify-between items-center border-b border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    {t('console.title', 'workspace')}
                </span>
                <div className="flex gap-1">
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors text-lg leading-none">&times;</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-[11px] custom-scrollbar">
                {logs.length === 0 && <div className="text-slate-600 italic p-4 text-center">{t('console.empty', 'workspace')}</div>}
                
                {logs.map((log) => {
                    const isSelected = selectedLogs.some(l => l.id === log.id);
                    return (
                        <div 
                            key={log.id} 
                            onClick={() => onToggleLog(log)}
                            className={`flex flex-col p-2 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 relative
                                ${isSelected ? 'bg-indigo-500/20 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}
                                ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'}
                            `}
                        >
                            <div className="flex gap-2">
                                <span className="opacity-40 select-none whitespace-nowrap min-w-[50px]">{log.time}</span>
                                <span className="break-all flex-1">{log.msg}</span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                                )}
                            </div>
                            
                            {log.source && (
                                <div className="flex justify-end mt-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate && onNavigate(log.source!.file, log.source!.line);
                                        }}
                                        className="text-[10px] text-white/30 hover:text-indigo-400 hover:underline decoration-indigo-400/30 underline-offset-2 transition-colors flex items-center gap-1"
                                    >
                                        {log.source.file}:{log.source.line}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="p-2 bg-white/5 border-t border-white/10 text-[9px] text-center text-slate-500">
                Click logs to attach to chat
            </div>
        </div>
    );
};
