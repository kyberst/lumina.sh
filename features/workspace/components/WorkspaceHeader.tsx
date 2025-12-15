
import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry, AppSettings } from '../../../types';
import { t } from '../../../services/i18n';

interface WorkspaceHeaderProps {
  entry: JournalEntry;
  rightTab: 'preview' | 'code' | 'info';
  setRightTab: (t: 'preview' | 'code' | 'info') => void;
  onClose: () => void;
  onSecurityScan: () => void;
  onPublish: () => void;
  onInvite: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  totalUsage?: { input: number, output: number };
  saveStatus?: 'saved' | 'saving' | 'error';
  isProcessing?: boolean;
  settings: AppSettings;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  entry, rightTab, setRightTab, onClose, onSecurityScan, onPublish, onInvite, onDownload, onRefresh, totalUsage, saveStatus = 'saved', isProcessing = false, settings
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { developerMode } = settings;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-lg z-20 border-b border-slate-800 relative">
      <div className="flex items-center gap-4 min-w-0">
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3">
                  <h1 className="text-base font-bold leading-none truncate text-slate-100">{entry.project || t('untitled', 'project')}</h1>
                  
                  {saveStatus === 'saving' ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-indigo-400 animate-pulse bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {t('status.saving', 'builder')}
                      </span>
                  ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-500/80 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          {t('status.saved', 'builder')}
                      </span>
                  )}
                  {isProcessing && (
                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-purple-400 animate-pulse bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                           <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           {t('luminaIsWorking', 'builder')}
                       </span>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                  <span className="hidden sm:inline">{entry.files.length} {t('files', 'workspace')}</span>
                  <span className="text-slate-600">•</span>
                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
          </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
           <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1 border border-slate-700/50">
               <button onClick={() => setRightTab('preview')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'preview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`} title={t('preview', 'builder')}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                   <span className="hidden sm:inline">{t('preview', 'builder')}</span>
               </button>
               
               {developerMode && (
                <button onClick={() => setRightTab('code')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'code' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`} title={t('code', 'builder')}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                   <span className="hidden sm:inline">{t('code', 'builder')}</span>
                </button>
               )}

               <button data-tour="properties-tab" onClick={() => setRightTab('info')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'info' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`} title={developerMode ? t('info', 'builder') : t('properties', 'builder')}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                   <span className="hidden sm:inline">{developerMode ? t('info', 'builder') : t('properties', 'builder')}</span>
               </button>
           </div>

           <button onClick={onInvite} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-slate-700 hover:bg-slate-600 text-white shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                <span className="hidden sm:inline">{t('invite', 'builder')}</span>
            </button>
           
           {!developerMode && (
              <button onClick={onPublish} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-900/20">
                  🚀
                  <span className="hidden sm:inline">{t('publishAppUserMode', 'builder')}</span>
              </button>
           )}
           
           <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>
           
           <div className="relative" ref={menuRef}>
               <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title={t('moreOptions', 'workspace')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
               </button>
               
               {showMenu && (
                   <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 origin-top-right z-50">
                       <div className="py-1">
                           <button onClick={() => { onSecurityScan(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              {t('runSecurityScan', 'workspace')}
                           </button>
                           {developerMode && (
                            <button onClick={() => { onPublish(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                                {t('publishBtn', 'builder')}
                            </button>
                           )}
                           <button onClick={() => { onDownload(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              {t('downloadZip', 'workspace')}
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={() => { onRefresh(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                              {t('refreshPreview', 'workspace')}
                           </button>
                       </div>
                   </div>
               )}
           </div>
      </div>
    </header>
  );
};
