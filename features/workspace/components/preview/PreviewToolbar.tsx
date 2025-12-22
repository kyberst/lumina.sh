
import React from 'react';
import { t } from '../../../../services/i18n';

interface Props {
    deviceMode: 'desktop' | 'tablet' | 'mobile';
    setDeviceMode: (m: 'desktop' | 'tablet' | 'mobile') => void;
    depStatus: 'idle' | 'loading' | 'ready' | 'error';
    isSelectionModeActive: boolean;
    onToggleSelectionMode: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
}

export const PreviewToolbar: React.FC<Props> = ({ deviceMode, setDeviceMode, depStatus, isSelectionModeActive, onToggleSelectionMode, onToggleFullscreen, isFullscreen }) => {
    return (
        <div className="glass-panel border-b border-white/10 p-2 flex justify-center items-center gap-2 sm:gap-4 shrink-0 relative z-20">
             <div className="flex gap-1 bg-muted/50 p-1 rounded-lg border border-white/5">
                {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
                    <button key={mode} onClick={() => setDeviceMode(mode)} className={`p-2 rounded-md transition-all duration-200 ${deviceMode === mode ? 'bg-background shadow-sm text-primary scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
                        {mode === 'mobile' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                        {mode === 'tablet' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                        {mode === 'desktop' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                    </button>
                ))}
             </div>

             <div className="w-px h-6 bg-border mx-1" />

             <div className="flex gap-2">
                <button onClick={() => onToggleSelectionMode()} title={t('toolbar.selectElement', 'workspace')} className={`p-2 rounded-lg transition-all ${isSelectionModeActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.8 3.8l16.4 16.4M20.2 3.8L3.8 20.2" /><path d="M12 22v-4.5" /><path d="M12 6.5V2" /><path d="M4.5 12H2" /><path d="M22 12h-2.5" /><path d="m3.5 15.5.7.7" /><path d="m3.5 8.5.7-.7" /><path d="m20.5 15.5-.7.7" /><path d="m20.5 8.5-.7-.7" /></svg>
                </button>
                 <button onClick={onToggleFullscreen} title={isFullscreen ? t('toolbar.exitFullscreen', 'workspace') : t('toolbar.fullscreen', 'workspace')} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                     {isFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                     )}
                 </button>
             </div>
             
             {depStatus === 'loading' && (
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary flex items-center gap-2 animate-pulse bg-primary/10 px-2 py-1 rounded-md">
                     <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     {t('toolbar.linking', 'workspace')}
                 </div>
             )}
        </div>
    );
};
