
import React, { useEffect, useState } from 'react';

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
  // Dependency Loading State
  const [depStatus, setDepStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [failedDeps, setFailedDeps] = useState<string[]>([]);

  // Reset status on reload
  useEffect(() => {
      setDepStatus('idle');
      setFailedDeps([]);
  }, [iframeKey]);

  // Listen for Dependency Events from Iframe
  useEffect(() => {
      const handler = (e: MessageEvent) => {
          if (e.data?.type === 'DEP_LOAD_START') {
              setDepStatus('loading');
          } else if (e.data?.type === 'DEP_LOAD_COMPLETE') {
              setDepStatus('ready');
              // Auto-hide success state after a moment
              setTimeout(() => setDepStatus('idle'), 2000); 
          } else if (e.data?.type === 'DEP_LOAD_ERROR') {
              setDepStatus('error');
              setFailedDeps(e.data.failures || []);
          }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-100">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-200 p-2 flex justify-center gap-4 shrink-0 relative">
             {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
                 <button key={mode} onClick={() => setDeviceMode(mode)} className={`p-2 rounded transition-colors ${deviceMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                     {mode === 'mobile' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'tablet' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'desktop' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                 </button>
             ))}
             
             {/* Dependency Status Indicator (Toolbar) */}
             {depStatus === 'loading' && (
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-medium flex items-center gap-2 animate-pulse">
                     <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Linking Modules...
                 </div>
             )}
        </div>

        {/* Iframe Container */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-200/50 relative">
            <iframe 
                key={iframeKey}
                srcDoc={iframeSrc}
                className={`bg-white shadow-2xl transition-all duration-300 ${deviceMode === 'mobile' ? 'w-[375px] h-[667px] shrink-0 rounded-[30px] border-8 border-slate-800' : deviceMode === 'tablet' ? 'w-[768px] h-[1024px] shrink-0 rounded-[20px] border-8 border-slate-800' : 'w-full h-full rounded-none border-0'}`}
                title="Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
            
            {/* Loading Overlay */}
            {depStatus === 'loading' && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-slate-800 font-bold tracking-wide text-sm">Resolving Dependencies...</div>
                </div>
            )}

            {/* Error Overlay */}
            {depStatus === 'error' && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-md flex items-center justify-center flex-col gap-4 animate-in zoom-in-95">
                     <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                     </div>
                     <div className="text-center">
                         <h3 className="text-slate-900 font-bold mb-1">Dependency Load Failed</h3>
                         <p className="text-slate-500 text-xs max-w-xs mx-auto mb-4">The following modules could not be resolved from CDN:</p>
                         <div className="bg-red-50 border border-red-100 rounded p-2 text-xs font-mono text-red-700 max-w-xs mx-auto">
                             {failedDeps.join(', ')}
                         </div>
                     </div>
                </div>
            )}
        </div>
        
        {/* Console Toggle */}
        <div className="absolute bottom-4 right-4 z-50">
            <button 
                onClick={() => setShowConsole(!showConsole)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 border transition-all ${errorCount > 0 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800'}`}
            >
                <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-white' : 'bg-emerald-500'}`}></div>
                Console: {errorCount > 0 ? `${errorCount} Errors` : 'Clean'}
            </button>
        </div>
        
        {/* Console Panel */}
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
