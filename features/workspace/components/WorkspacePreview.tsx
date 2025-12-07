
import React, { useEffect, useState } from 'react';
import { PreviewToolbar } from './preview/PreviewToolbar';
import { ConsolePanel } from './preview/ConsolePanel';
import { EnvVarRequest } from '../../../types';

interface WorkspacePreviewProps {
  iframeSrc: string; // Deprecated, managed by hook now but kept for sig compat if needed
  iframeKey: number;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  setDeviceMode: (m: 'desktop' | 'tablet' | 'mobile') => void;
  showConsole: boolean;
  setShowConsole: (v: boolean) => void;
  consoleLogs: { type: string, msg: string, time: string, source?: { file: string, line: number } }[];
  errorCount: number;
  onClearLogs: () => void;
  onNavigateError?: (file: string, line: number) => void;
  // New Props
  envVars?: Record<string, string>;
  requiredEnvVars?: EnvVarRequest[];
  entryFiles?: any[]; // Passed to re-generate iframe within this component if we refactor completely, but we use the parent's hook mostly.
}

// NOTE: We are moving logic INTO this component from parent to handle iframeRef correctly
// But to minimize disruption, we accept the hook results or use the hook here. 
// Ideally, the hook `usePreviewSystem` should be used inside the parent `WorkspaceView` and props passed down.
// However, `iframeRef` needs to be bound here. 
// Let's assume the parent `WorkspaceView` creates the logic, but we need to bind the ref here.
// Actually, `iframeSrc` is passed from parent. The parent `WorkspaceView` calls `usePreviewSystem`.
// We need to pass `iframeRef` UP or handle the `postMessage` from parent.
// BETTER: Let `usePreviewSystem` reside in `WorkspaceView` (as it does now) and we just render.
// BUT `iframeRef` in `usePreviewSystem` needs to attach to the element here.
// Solution: We will attach the ref using a callback or ref forwarding, OR we just trust `e.source` in the event handler.
// The updated `usePreviewSystem` uses `e.source` as fallback, so it works even if ref is null.

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  iframeSrc, iframeKey, deviceMode, setDeviceMode, showConsole, setShowConsole, consoleLogs, errorCount, onClearLogs, onNavigateError
}) => {
  const [depStatus, setDepStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [failedDeps, setFailedDeps] = useState<string[]>([]);

  useEffect(() => {
      setDepStatus('idle');
      setFailedDeps([]);
  }, [iframeKey]);

  useEffect(() => {
      const handler = (e: MessageEvent) => {
          if (e.data?.type === 'DEP_LOAD_START') setDepStatus('loading');
          else if (e.data?.type === 'DEP_LOAD_COMPLETE') {
              setDepStatus('ready');
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
        <PreviewToolbar deviceMode={deviceMode} setDeviceMode={setDeviceMode} depStatus={depStatus} />

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-200/50 relative">
            <iframe 
                key={iframeKey}
                srcDoc={iframeSrc}
                className={`bg-white shadow-2xl transition-all duration-300 ${deviceMode === 'mobile' ? 'w-[375px] h-[667px] shrink-0 rounded-[30px] border-8 border-slate-800' : deviceMode === 'tablet' ? 'w-[768px] h-[1024px] shrink-0 rounded-[20px] border-8 border-slate-800' : 'w-full h-full rounded-none border-0'}`}
                title="Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
            
            {depStatus === 'loading' && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in">
                    <div className="relative"><div className="w-12 h-12 rounded-full border-4 border-slate-200"></div><div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div></div>
                    <div className="text-slate-800 font-bold tracking-wide text-sm">Resolving Dependencies...</div>
                </div>
            )}

            {depStatus === 'error' && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-md flex items-center justify-center flex-col gap-4 animate-in zoom-in-95">
                     <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">⚠</div>
                     <div className="text-center">
                         <h3 className="text-slate-900 font-bold mb-1">Dependency Load Failed</h3>
                         <div className="bg-red-50 border border-red-100 rounded p-2 text-xs font-mono text-red-700 max-w-xs mx-auto">{failedDeps.join(', ')}</div>
                     </div>
                </div>
            )}
        </div>
        
        <div className="absolute bottom-4 right-4 z-50">
            <button onClick={() => setShowConsole(!showConsole)} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 border transition-all ${errorCount > 0 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-white' : 'bg-emerald-500'}`}></div>
                Console: {errorCount > 0 ? `${errorCount} Errors` : 'Clean'}
            </button>
        </div>
        
        {showConsole && (
            <ConsolePanel 
                logs={consoleLogs} 
                onClear={onClearLogs} 
                onClose={() => setShowConsole(false)} 
                onNavigate={onNavigateError} 
            />
        )}
    </div>
  );
};
