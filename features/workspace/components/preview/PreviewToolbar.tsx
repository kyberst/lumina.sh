
import React from 'react';
import { t } from '../../../../services/i18n';

interface Props {
    deviceMode: 'desktop' | 'tablet' | 'mobile';
    setDeviceMode: (m: 'desktop' | 'tablet' | 'mobile') => void;
    depStatus: 'idle' | 'loading' | 'ready' | 'error';
}

/**
 * Toolbar de Preview.
 * Permite cambiar entre modos de dispositivo (Responsive) y ver estado de carga.
 */
export const PreviewToolbar: React.FC<Props> = ({ deviceMode, setDeviceMode, depStatus }) => {
    return (
        <div className="bg-white border-b border-slate-200 p-2 flex justify-center gap-4 shrink-0 relative">
             {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
                 <button key={mode} onClick={() => setDeviceMode(mode)} className={`p-2 rounded transition-colors ${deviceMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                     {mode === 'mobile' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'tablet' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                     {mode === 'desktop' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                 </button>
             ))}
             
             {depStatus === 'loading' && (
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-600 font-medium flex items-center gap-2 animate-pulse">
                     <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     {t('dependencies.loading', 'common')}
                 </div>
             )}
        </div>
    );
};
