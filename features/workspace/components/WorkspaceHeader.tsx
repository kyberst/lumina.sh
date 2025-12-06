
import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry } from '../../../types';

interface WorkspaceHeaderProps {
  entry: JournalEntry;
  rightTab: 'preview' | 'code' | 'info';
  setRightTab: (t: 'preview' | 'code' | 'info') => void;
  onClose: () => void;
  onSecurityScan: () => void;
  onPublish: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  totalUsage?: { input: number, output: number };
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  entry, rightTab, setRightTab, onClose, onSecurityScan, onPublish, onDownload, onRefresh, totalUsage
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

  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-lg z-20 border-b border-slate-800 relative">
      <div className="flex items-center gap-4 min-w-0">
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
          </button>
          <div className="flex flex-col min-w-0">
              <h1 className="text-base font-bold leading-none truncate text-slate-100">{entry.project || 'Untitled Project'}</h1>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                  <span className="hidden sm:inline">{entry.files.length} Files</span>
                  <span className="hidden sm:inline">•</span>
                  
                  {totalUsage && (
                      <div className="flex items-center gap-2 bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">
                          <span>In: {totalUsage.input.toLocaleString()}</span>
                          <span className="text-slate-600">|</span>
                          <span>Out: {totalUsage.output.toLocaleString()}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
           {/* Center Tabs */}
           <div className="flex bg-slate-800/50 rounded-lg p-1 gap-1 border border-slate-700/50">
               <button 
                onClick={() => setRightTab('preview')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'preview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Preview"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                   <span className="hidden sm:inline">Preview</span>
               </button>
               
               <button 
                onClick={() => setRightTab('code')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'code' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Code"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                   <span className="hidden sm:inline">Code</span>
               </button>

               <button 
                onClick={() => setRightTab('info')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${rightTab === 'info' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Info"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                   <span className="hidden sm:inline">Info</span>
               </button>
           </div>
           
           <div className="w-px h-6 bg-slate-700 mx-1 hidden sm:block"></div>
           
           {/* Actions - Dropdown Menu */}
           <div className="relative" ref={menuRef}>
               <button 
                  onClick={() => setShowMenu(!showMenu)} 
                  className={`p-2 rounded-lg transition-all ${showMenu ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  title="More Options"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
               </button>
               
               {showMenu && (
                   <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 origin-top-right z-50">
                       <div className="py-1">
                           <button onClick={() => { onSecurityScan(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              Run Security Scan
                           </button>
                           <button onClick={() => { onPublish(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                              Publish to GitHub
                           </button>
                           <button onClick={() => { onDownload(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Download ZIP
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button onClick={() => { onRefresh(); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
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
