
import React from 'react';
import { t } from '../../../services/i18n';
import { ViewMode, User } from '../../../types';

interface LayoutViewProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: ViewMode) => void;
  language?: 'en' | 'es';
  onLanguageChange?: (lang: 'en' | 'es') => void;
  user?: User | null;
  onLogout?: () => void;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

export const LayoutView: React.FC<LayoutViewProps> = ({ 
    children, currentView, onNavigate, language, onLanguageChange, user, onLogout, showProfileMenu, setShowProfileMenu, menuRef 
}) => {

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
            lumina<span className="text-indigo-600">.sh</span>
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

            <button onClick={() => onNavigate('settings')} className={`p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors shrink-0 ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600' : ''}`} title={t('settings', 'nav')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>

          {/* Profile Menu */}
          {user && (
              <div className="relative ml-1 sm:ml-3" ref={menuRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden hover:border-indigo-500 transition-all focus:outline-none bg-white shadow-sm relative z-50">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff`} 
                        className="w-full h-full object-cover" 
                        alt={t('profileAlt', 'nav')}
                      />
                  </button>
                  {showProfileMenu && (
                      <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[60]">
                          <div className="px-4 py-4 bg-slate-50 border-b border-slate-100">
                              <div className="font-semibold text-slate-800 text-sm truncate">{user.name}</div>
                              <div className="text-[10px] text-slate-500 truncate mb-2">{user.email}</div>
                              <div className="inline-flex items-center text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">{user.credits} CREDITS</div>
                          </div>
                          <button onClick={() => { onNavigate('profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              {t('profile', 'nav')}
                          </button>
                          
                          <button onClick={() => { onLogout?.(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-50">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                              {t('logout', 'nav')}
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-28 px-4 pb-12 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 bg-white mt-auto shrink-0 relative z-10">
          <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {t('copyright', 'nav').replace('{year}', new Date().getFullYear().toString())}
              </p>
          </div>
      </footer>
    </div>
  );
};
