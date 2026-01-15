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
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isSelectionModeActive: boolean;
  onToggleSelectionMode: () => void;
  consolePanelProps?: any; 
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({
  iframeSrc, iframeKey, deviceMode, setDeviceMode, showConsole, setShowConsole, consoleLogs, errorCount, onClearLogs, onNavigateError,
  iframeRef, isSelectionModeActive, onToggleSelectionMode, consolePanelProps
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

        <div className={`flex-1 overflow-auto bg-[#0f172a] bg-grid-mystic relative min-h-0 custom-scrollbar flex flex-col items-center justify-center transition-all duration-300
            ${deviceMode === 'desktop' ? 'p-0' : 'p-4 sm:p-10'}
        `}>
            <div className={`relative transition-all duration-500 flex items-center justify-center
                ${deviceMode === 'mobile' ? 'w-[375px] h-full max-h-[720px]' : 
                  deviceMode === 'tablet' ? 'w-[768px] h-full max-h-[1024px]' : 
                  'w-full h-full'}
            `}>
                <iframe 
                    ref={iframeRef}
                    key={iframeKey}
                    srcDoc={iframeSrc}
                    className={`bg-white shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out border-slate-800/80
                        ${deviceMode === 'desktop' 
                            ? 'w-full h-full rounded-none border-0' 
                            : 'w-full h-full rounded-[2.5rem] border-[4px] ring-1 ring-white/5'
                        }`}
                    title="Preview"
                    sandbox="allow-scripts allow-modals allow-same-origin"
                />
                
                {/* Visual hardware details - Soft bottom pill only */}
                {deviceMode !== 'desktop' && (
                    <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-800/40 rounded-full z-10 shadow-inner"></div>
                )}
            </div>
            
            {depStatus === 'loading' && (
                <div className="absolute inset-0 z-10 bg-[#0f172a]/60 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in pointer-events-none">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-white/5"></div>
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-white font-bold tracking-[0.2em] text-xs uppercase animate-pulse">{t('preview.resolving', 'workspace')}</div>
                </div>
            )}

            {depStatus === 'error' && (
                <div className="absolute inset-0 z-10 bg-red-950/90 backdrop-blur-md flex items-center justify-center flex-col gap-4 animate-in zoom-in-95">
                     <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-2 border border-red-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                          {/* Fixed: changed cy1 to y1 to resolve TypeScript error */}
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                     </div>
                     <div className="text-center px-6">
                         <h3 className="text-white font-bold text-lg mb-1">{t('preview.failed', 'workspace')}</h3>
                         <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-red-300 max-w-sm mx-auto shadow-2xl">
                             {failedDeps.join(', ')}
                         </div>
                     </div>
                </div>
            )}
        </div>
        
        <div className="absolute bottom-4 right-4 z-50">
            <button onClick={() => setShowConsole(!showConsole)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 border transition-all duration-300 ${errorCount > 0 ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-black'}`}>
                <div className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-white shadow-[0_0_8px_white]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                CONSOLE {errorCount > 0 ? `(${errorCount})` : ''}
            </button>
        </div>
        
        {showConsole && consolePanelProps && (
            <ConsolePanel {...consolePanelProps} />
        )}
    </div>
  );
};