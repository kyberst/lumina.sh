
import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry } from '../../../types';
import { t } from '../../../services/i18n';
import { MobileView } from '../hooks/useWorkspaceLayout';

type PanelType = 'preview' | 'code' | 'info' | 'history' | null;

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
}

const panelNames: Record<string, string> = {
    preview: 'Preview',
    code: 'Code Editor',
    info: 'Project Info',
    history: 'Time Travel'
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  entry, rightTab, setRightTab, onClose, onSecurityScan, onPublish, onDownload, onRefresh, totalUsage, saveStatus = 'saved',
  isMobile, mobileView, setMobileView
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="flex bg-slate-700 p-1 rounded-lg">
        <button 
            onClick={() => setMobileView && setMobileView('chat')} 
            className={`p-2 rounded transition-colors ${mobileView === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300 hover:bg-slate-600'}`}
            aria-label="Switch to Chat View"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <button 
            onClick={() => setMobileView && setMobileView('panel')} 
            className={`p-2 rounded transition-colors ${mobileView === 'panel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-300 hover:bg-slate-600'}`}
            aria-label="Switch to Panel View"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
        </button>
    </div>
  );

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-lg z-20 border-b border-slate-800 relative">
      <div className="flex items-center gap-4 min-w-0">
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3">
                  <h1 className="text-base font-bold leading-none truncate text-slate-100">{entry.project || 'Untitled Project'}</h1>
                  {saveStatus === 'saving' ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-indigo-400 animate-pulse bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          <svg className="animate-spin h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {t('saving', 'journal.status')}
                      </span>
                  ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-500/80 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          {t('saved', 'journal.status')}
                      </span>
                  )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                  <span className="hidden sm:inline">{(entry.files ?? []).length} Files</span>
                  <span className="text-slate-600">•</span>
                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
              </div>
          </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
           {isMobile ? (
             <MobileToggle />
           ) : (
             rightTab && (
                <div className="flex items-center gap-2 bg-slate-700/80 text-slate-300 text-xs font-bold pl-3 pr-1 py-1 rounded-full animate-in fade-in zoom-in-95">
                    <span>{panelNames[rightTab]}</span>
                    <button onClick={() => setRightTab(null)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-600 rounded-full" title="Close Panel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
             )
           )}

           <div className="relative" ref={menuRef}>
               <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} title="More Options">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
               </button>
               
               {showMenu && (
                   <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 origin-top-right z-50">
                       <div className="p-1">
                            <button onClick={() => handleSetTab('preview')} className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-3 transition-colors rounded-md ${rightTab==='preview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                               {panelNames.preview}
                            </button>
                            <button onClick={() => handleSetTab('code')} className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-3 transition-colors rounded-md ${rightTab==='code' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                               {panelNames.code}
                            </button>
                            <button onClick={() => handleSetTab('info')} className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-3 transition-colors rounded-md ${rightTab==='info' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                               {panelNames.info}
                            </button>
                            <button onClick={() => handleSetTab('history')} className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-3 transition-colors rounded-md ${rightTab==='history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                               {panelNames.history}
                            </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={() => { onSecurityScan(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              Run Security Scan
                           </button>
                           <button onClick={() => { onPublish(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                              Publish to GitHub
                           </button>
                           <button onClick={() => { onDownload(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Download ZIP
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={() => { onRefresh(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors rounded-md">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                              Refresh Preview
                           </button>
                       </div>
                   </div>
               )}
           </div>
      </div>
    </header>
  );
};
