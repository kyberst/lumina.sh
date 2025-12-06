
import React from 'react';

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

/**
 * Panel de Consola.
 * Muestra stdout/stderr capturado del iframe y permite navegar al código fuente.
 */
export const ConsolePanel: React.FC<Props> = ({ logs, onClear, onClose, onNavigate }) => {
    return (
        <div className="absolute bottom-14 right-4 w-80 sm:w-96 max-h-[400px] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 z-50">
            <div className="bg-slate-800 p-2 flex justify-between items-center border-b border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2">System Logs</span>
                <div className="flex gap-2">
                    <button onClick={onClear} className="text-[10px] text-slate-400 hover:text-white">Clear</button>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">×</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                {logs.length === 0 && <div className="text-slate-500 italic p-2">No logs yet...</div>}
                {logs.map((log, i) => (
                    <div key={i} className={`flex flex-col p-1.5 border-b border-slate-800/50 ${log.type === 'error' ? 'bg-red-900/10' : ''}`}>
                        <div className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-slate-300'}`}>
                            <span className="opacity-50 select-none text-[10px] whitespace-nowrap">{log.time}</span>
                            <span className="break-all">{log.msg}</span>
                        </div>
                        {log.source && onNavigate && (
                            <button 
                                onClick={() => onNavigate(log.source!.file, log.source!.line)}
                                className="self-end mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                            >
                                <span>at {log.source.file}:{log.source.line}</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
