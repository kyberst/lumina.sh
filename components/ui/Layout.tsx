
import React, { useState, useEffect, useRef } from 'react';
import { t } from '../../services/i18n';
import { ViewMode } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: ViewMode) => void;
  language?: 'en' | 'es';
  onLanguageChange?: (lang: 'en' | 'es') => void;
  onStartTutorial?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, language, onLanguageChange, onStartTutorial }) => {
  const navItemClass = (view: string) => 
    `relative flex items-center gap-2 text-sm font-semibold transition-all px-5 py-2.5 rounded-full overflow-hidden shrink-0 ${
      currentView === view 
        ? 'text-white shadow-md shadow-indigo-500/20' 
        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
    }`;

  const activeGradient = "absolute inset-0 bg-indigo-600 z-0";

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col bg-slate-50">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl h-20 flex items-center justify-between px-4 sm:px-10 shadow-sm transition-all supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onNavigate('builder')}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
            <span className="text-white font-bold text-lg tracking-tighter">Lu</span>
          </div>
          <span className="text-xl font-bold text-slate-900 hidden sm:block tracking-tight font-['Plus_Jakarta_Sans']">
            Lumina<span className="text-indigo-600">.Studio</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Scrollable Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-2 max-w-[calc(100vw-160px)] sm:max-w-none">
            <button onClick={() => onNavigate('builder')} className={navItemClass('builder')}>
              {currentView === 'builder' && <div className={activeGradient}></div>}
              <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  <span className="hidden md:inline">{t('journal', 'nav')}</span>
              </span>
            </button>
            <button onClick={() => onNavigate('projects')} className={navItemClass('projects')}>
               {currentView === 'projects' && <div className={activeGradient}></div>}
               <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span className="hidden md:inline">{t('memories', 'nav')}</span>
               </span>
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-1 sm:mx-2 hidden sm:block"></div>

            {onStartTutorial && (
              <button onClick={onStartTutorial} className={`p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors shrink-0`} title="Help / Tutorial">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </button>
            )}

            <button onClick={() => onNavigate('settings')} className={`p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors shrink-0 ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600' : ''}`} title={t('settings', 'nav')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-28 px-4 pb-12 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 bg-white mt-auto shrink-0 relative z-10">
          <div className="flex flex-col items-center gap-4">
              
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Lumina Studio © {new Date().getFullYear()}
              </p>
          </div>
      </footer>
    </div>
  );
};
