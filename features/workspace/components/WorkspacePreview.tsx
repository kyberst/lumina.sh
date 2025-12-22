
import React, { useEffect, useState, useRef } from 'react';
import { PreviewToolbar } from './preview/PreviewToolbar';
import { ConsolePanel } from './preview/ConsolePanel';
import { t } from '../../../services/i18n';

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
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  iframeSrc, iframeKey, deviceMode, setDeviceMode, showConsole, setShowConsole, consoleLogs, errorCount, onClearLogs, onNavigateError,
  iframeRef, isSelectionModeActive, onToggleSelectionMode
}) => {
  const [depStatus, setDepStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [failedDeps, setFailedDeps] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

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

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[500] bg-slate-900 animate-in fade-in p-4 flex items-center justify-center">
        <button 
          onClick={handleToggleFullscreen}
          title={t('toolbar.exitFullscreen', 'workspace')}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        </button>
        <iframe 
            ref={iframeRef}
            key={iframeKey}
            srcDoc={iframeSrc}
            className="w-full h-full border-0 bg-white rounded-lg shadow-2xl"
            title="Preview"
            sandbox="allow-scripts allow-modals allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-100">
        <PreviewToolbar 
            deviceMode={deviceMode} 
            setDeviceMode={setDeviceMode} 
            depStatus={depStatus}
            isSelectionModeActive={isSelectionModeActive}
            onToggleSelectionMode={onToggleSelectionMode}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
        />

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-200/50 relative">
            <iframe 
                ref={iframeRef}
                key={iframeKey}
                srcDoc={iframeSrc}
                className={`bg-white shadow-2xl transition-all duration-300 ${deviceMode === 'mobile' ? 'w-[375px] h-[667px] shrink-0 rounded-[30px] border-8 border-slate-800' : deviceMode === 'tablet' ? 'w-[768px] h-[1024px] shrink-0 rounded-[20px] border-8 border-slate-800' : 'w-full h-full rounded-none border-0'}`}
                title="Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
            
            {depStatus === 'loading' && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in">
                    <div className="relative"><div className="w-12 h-12 rounded-full border-4 border-slate-200"></div><div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div></div>
                    <div className="text-slate-800 font-bold tracking-wide text-sm">{t('preview.resolving', 'workspace')}</div>
                </div>
            )}

            {depStatus === 'error' && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-md flex items-center justify-center flex-col gap-4 animate-in zoom-in-95">
                     <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">⚠</div>
                     <div className="text-center">
                         <h3 className="text-slate-900 font-bold mb-1">{t('preview.failed', 'workspace')}</h3>
                         <div className="bg-red-50 border border-red-100 rounded p-2 text-xs font-mono text-red-700 max-w-xs mx-auto">{failedDeps.join(', ')}</div>
                     </div>
                </div>
            )}
        </div>
        
        <div className="absolute bottom-4 right-4 z-50">
            <button onClick={() => setShowConsole(!showConsole)} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 border transition-all ${errorCount > 0 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800'}`}>
                <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-white' : 'bg-emerald-500'}`}></div>
                Console: {errorCount > 0 ? `${errorCount} ${t('preview.consoleErrors', 'workspace')}` : t('preview.consoleClean', 'workspace')}
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
