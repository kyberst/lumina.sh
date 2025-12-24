
import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry } from '../../../types';
import { t } from '../../../services/i18n';
import { MobileView, PanelType } from '../hooks/useWorkspaceLayout';

interface WorkspaceHeaderProps {
  entry: JournalEntry;
  rightTab: PanelType;
  setRightTab: (t: PanelType) => void;
  onClose: () => void;
  onSecurityScan: () => void;
  onPublish: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  totalUsage?: { input: number, output: number };
  saveStatus?: 'saved' | 'saving' | 'error';
  isMobile?: boolean;
  mobileView?: MobileView;
  setMobileView?: (v: MobileView) => void;
  isScanningSecurity?: boolean;
  hasFiles?: boolean;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  entry, rightTab, setRightTab, onClose, onSecurityScan, onPublish, onDownload, onRefresh, totalUsage, saveStatus = 'saved',
  isMobile, mobileView, setMobileView, isScanningSecurity, hasFiles
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const panelNames: Record<string, string> = {
    preview: t('panel.preview', 'workspace'),
    code: t('panel.code', 'workspace'),
    info: t('panel.info', 'workspace'),
    history: t('panel.history', 'workspace'),
    security: t('security', 'builder'),
    publish: t('publish', 'builder')
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSetTab = (tab: PanelType) => {
    setRightTab(tab);
    setShowMenu(false);
  };

  const MobileToggle = () => (
    <div className="flex bg-white/10 p-1 rounded-lg border border-white/10 backdrop-blur-sm shrink-0">
        <button 
            onClick={() => setMobileView && setMobileView('chat')} 
            className={`p-1.5 sm:p-2 rounded transition-all duration-300 ${mobileView === 'chat' ? 'bg-primary text-primary-foreground shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            aria-label="Chat"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <button 
            onClick={() => setMobileView && setMobileView('panel')} 
            className={`p-1.5 sm:p-2 rounded transition-all duration-300 ${mobileView === 'panel' ? 'bg-primary text-primary-foreground shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            aria-label="Preview & Tools"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
        </button>
    </div>
  );

  return (
    <header className="h-14 sm:h-16 bg-[#0f172a] text-white flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-xl z-50 border-b border-white/5 relative">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button 
            onClick={onClose} 
            className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all hover:-translate-x-0.5 shrink-0"
            title="Back to Dashboard"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          
          <div className="flex flex-col min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 sm:gap-3">
                  <h1 className="text-sm sm:text-base font-bold leading-none truncate text-white tracking-tight font-['Plus_Jakarta_Sans']">
                    {entry.project || t('projectDefault', 'workspace')}
                  </h1>
                  {saveStatus === 'saving' ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary animate-pulse bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                          <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          <span className="hidden sm:inline">{t('status.saving', 'journal')}</span>
                      </span>
                  ) : (
                      <div className="group relative shrink-0">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400/80 transition-all opacity-60 group-hover:opacity-100 cursor-default">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span className="hidden sm:inline">{t('status.saved', 'journal')}</span>
                        </span>
                      </div>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-slate-500">
                  <span className="truncate hidden xs:inline">{(entry.files ?? []).length} {t('proposal.files', 'journal')}</span>
                  <span className="text-slate-700 hidden xs:inline">•</span>
                  <span className="font-mono opacity-70 truncate">{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
          </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
           {isMobile ? (
             <MobileToggle />
           ) : (
             rightTab && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 text-xs font-bold pl-3 pr-1 py-1 rounded-full animate-in fade-in zoom-in-95 shadow-inner hidden md:flex">
                    <span>{panelNames[rightTab] || rightTab}</span>
                    <button onClick={() => setRightTab(null)} className="text-slate-500 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all" title={t('action.close', 'workspace')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
             )
           )}

           <div className="relative" ref={menuRef}>
               <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 sm:p-2 rounded-xl transition-all border ${showMenu ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/10'}`} title={t('action.options', 'workspace')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
               </button>
               
               {showMenu && (
                   <div className="absolute right-0 top-12 sm:top-14 w-56 sm:w-60 bg-[#1e293b] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 origin-top-right z-50 p-1.5">
                       <div className="space-y-0.5">
                            {['preview', 'code', 'info', 'history'].map((tab) => (
                                <button key={tab} onClick={() => handleSetTab(tab as PanelType)} className={`w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 transition-all rounded-lg group ${rightTab===tab ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                   {tab === 'preview' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                                   {tab === 'code' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
                                   {tab === 'info' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>}
                                   {tab === 'history' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>}
                                   {panelNames[tab]}
                                   {rightTab===tab && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>}
                                </button>
                            ))}
                           
                           <div className="h-px bg-white/10 my-1.5 mx-2"></div>
                           
                           <button onClick={() => handleSetTab('publish')} className={`w-full text-left px-3 py-2.5 text-xs font-bold flex items-center gap-3 transition-colors rounded-lg group ${rightTab==='publish' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${rightTab==='publish' ? 'text-white' : 'bg-sky-500/10 text-sky-500 group-hover:bg-sky-500 group-hover:text-white'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                              </div>
                              {t('publish', 'builder')}
                              {rightTab==='publish' && <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>}
                           </button>

                           <button 
                                onClick={() => { onSecurityScan(); setShowMenu(false); }} 
                                disabled={isScanningSecurity || !hasFiles}
                                className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                {isScanningSecurity ? (
                                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                )}
                              </div>
                              {isScanningSecurity ? "Scanning..." : t('action.scan', 'workspace')}
                           </button>
                           
                           <button onClick={() => { onDownload(); setShowMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors rounded-lg group">
                              <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              </div>
                              {t('action.download', 'workspace')}
                           </button>
                           <div className="h-px bg-white/10 my-1.5 mx-2"></div>
                           <button onClick={() => { onRefresh(); setShowMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors rounded-lg group">
                              <div className="w-6 h-6 rounded-md bg-slate-700/50 text-slate-300 flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                              </div>
                              {t('action.refresh', 'workspace')}
                           </button>
                       </div>
                   </div>
               )}
           </div>
      </div>
    </header>
  );
};
