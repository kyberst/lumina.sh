
import React from 'react';

interface WorkspacePreviewProps {
  iframeSrc: string;
  iframeKey: number;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  setDeviceMode: (m: 'desktop' | 'tablet' | 'mobile') => void;
  showConsole: boolean;
  setShowConsole: (v: boolean) => void;
  consoleLogs: { type: string, msg: string, time: string, source?: { file: string, line: number } }[];
  errorCount: number;
  onClearLogs: () => void;
  onNavigateError?: (file: string, line: number) => void;
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  iframeSrc, iframeKey, deviceMode, setDeviceMode, showConsole, setShowConsole, consoleLogs, errorCount, onClearLogs, onNavigateError
}) => {
  return (
    <div className="w-full h-full flex flex-col relative bg-slate-100">
        <div className="bg-white border-b border-slate-200 p-2 flex justify-center gap-4 shrink-0">
             {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
                 <button key={mode} onClick={() => setDeviceMode(mode)} className={`p-2 rounded ${deviceMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                     {mode === 'mobile' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'tablet' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'desktop' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                 </button>
             ))}
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-200/50">
            <iframe 
                key={iframeKey}
                srcDoc={iframeSrc}
                className={`bg-white shadow-2xl transition-all duration-300 ${deviceMode === 'mobile' ? 'w-[375px] h-[667px] shrink-0 rounded-[30px] border-8 border-slate-800' : deviceMode === 'tablet' ? 'w-[768px] h-[1024px] shrink-0 rounded-[20px] border-8 border-slate-800' : 'w-full h-full rounded-none border-0'}`}
                title="Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
        </div>
        
        <div className="absolute bottom-4 right-4 z-50">
            <button 
                onClick={() => setShowConsole(!showConsole)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 border transition-all ${errorCount > 0 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800'}`}
            >
                <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-white' : 'bg-emerald-500'}`}></div>
                Console: {errorCount > 0 ? `${errorCount} Errors` : 'Clean'}
            </button>
        </div>
        
        {showConsole && (
            <div className="absolute bottom-14 right-4 w-80 sm:w-96 max-h-[400px] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 z-50">
                <div className="bg-slate-800 p-2 flex justify-between items-center border-b border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2">System Logs</span>
                    <div className="flex gap-2">
                        <button onClick={onClearLogs} className="text-[10px] text-slate-400 hover:text-white">Clear</button>
                        <button onClick={() => setShowConsole(false)} className="text-slate-400 hover:text-white">×</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                    {consoleLogs.length === 0 && <div className="text-slate-500 italic p-2">No logs yet...</div>}
                    {consoleLogs.map((log, i) => (
                        <div key={i} className={`flex flex-col p-1.5 border-b border-slate-800/50 ${log.type === 'error' ? 'bg-red-900/10' : ''}`}>
                            <div className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-slate-300'}`}>
                                <span className="opacity-50 select-none text-[10px] whitespace-nowrap">{log.time}</span>
                                <span className="break-all">{log.msg}</span>
                            </div>
                            {log.source && onNavigateError && (
                                <button 
                                    onClick={() => onNavigateError(log.source!.file, log.source!.line)}
                                    className="self-end mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                                >
                                    <span>at {log.source.file}:{log.source.line}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
