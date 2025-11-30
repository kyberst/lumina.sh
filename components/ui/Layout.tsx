
import React, { useState, useEffect, useRef } from 'react';
import { t } from '../../services/i18n';
import { ViewMode, User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: ViewMode) => void;
  language?: 'en' | 'es';
  onLanguageChange?: (lang: 'en' | 'es') => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, language, onLanguageChange, user, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setShowProfileMenu(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItemClass = (view: string) => 
    `relative flex items-center gap-2 text-sm font-bold transition-all px-5 py-2.5 rounded-full overflow-hidden shrink-0 ${
      currentView === view 
        ? 'text-white shadow-lg shadow-[#ff7e15]/30' 
        : 'text-slate-500 hover:text-[#ff7e15] hover:bg-[#ffff7e]/50'
    }`;

  const activeGradient = "absolute inset-0 bg-gradient-to-r from-[#ff2935] to-[#ff7e15] z-0";

  return (
    <div className="min-h-screen font-sans selection:bg-[#ffc93a] selection:text-[#ff2935] flex flex-col bg-gradient-to-br from-[#ffffbb] via-[#fffdf0] to-white">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#ffc93a]/30 bg-[#ffffbb]/80 backdrop-blur-xl h-20 flex items-center justify-between px-4 sm:px-10 shadow-sm transition-all supports-[backdrop-filter]:bg-[#ffffbb]/60">
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onNavigate('builder')}>
          <div className="w-11 h-11 bg-gradient-to-br from-[#ff2935] via-[#ff7e15] to-[#ffc93a] rounded-2xl shadow-lg shadow-[#ff7e15]/20 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <span className="text-white font-black text-xl tracking-tighter">Db</span>
          </div>
          <span className="text-2xl font-extrabold text-slate-800 hidden sm:block tracking-tight font-['Plus_Jakarta_Sans']">
            Dyad<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2935] to-[#ff7e15]">.Build</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Scrollable Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-2 max-w-[calc(100vw-160px)] sm:max-w-none">
            <button onClick={() => onNavigate('builder')} className={navItemClass('builder')}>
              {currentView === 'builder' && <div className={activeGradient}></div>}
              <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  <span className="hidden md:inline">{t('journal', 'nav')}</span>
              </span>
            </button>
            <button onClick={() => onNavigate('projects')} className={navItemClass('projects')}>
               {currentView === 'projects' && <div className={activeGradient}></div>}
               <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span className="hidden md:inline">{t('memories', 'nav')}</span>
               </span>
            </button>
            
            <div className="w-px h-8 bg-[#ffc93a] mx-1 sm:mx-2 hidden sm:block opacity-50"></div>

            <button onClick={() => onNavigate('settings')} className={`p-2.5 rounded-full hover:bg-[#ffff7e]/50 text-slate-500 hover:text-[#ff7e15] transition-colors shrink-0 ${currentView === 'settings' ? 'bg-[#ffff7e] text-[#ff7e15]' : ''}`} title={t('settings', 'nav')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>

          {/* Profile Menu - Outside Overflow Container to prevent clipping */}
          {user && (
              <div className="relative ml-1 sm:ml-3" ref={menuRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-full border-2 border-[#ffff7e] overflow-hidden hover:border-[#ff7e15] transition-all focus:outline-none bg-white shadow-sm relative z-50">
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=ff7e15&color=fff`} 
                        className="w-full h-full object-cover" 
                        alt="Profile"
                      />
                  </button>
                  {showProfileMenu && (
                      <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-[#ffc93a]/30 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[60]">
                          <div className="px-4 py-4 bg-[#ffffbb]/20 border-b border-[#ffc93a]/20">
                              <div className="font-bold text-slate-800 text-sm truncate">{user.name}</div>
                              <div className="text-[10px] text-slate-500 truncate mb-2">{user.email}</div>
                              <div className="inline-flex items-center text-[10px] font-black text-white bg-[#ff7e15] px-2 py-0.5 rounded-full">{user.credits} CREDITS</div>
                          </div>
                          <button onClick={() => { onNavigate('profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-[#ffff7e]/50 hover:text-[#ff7e15] transition-colors flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              {t('profile', 'nav')}
                          </button>
                          
                          <button onClick={() => { onLogout?.(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-slate-50">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
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
      <footer className="py-8 text-center border-t border-[#ffc93a]/20 bg-[#ffffbb]/30 mt-auto shrink-0 relative z-10">
          <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                  <select
                      value={language}
                      onChange={(e) => onLanguageChange?.(e.target.value as 'en' | 'es')}
                      className="appearance-none bg-white border border-[#ffc93a]/50 hover:border-[#ff7e15] text-[#ff7e15] text-xs font-bold py-2 pl-4 pr-10 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ffff7e] transition-all shadow-sm"
                  >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ff7e15]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Dyad.Build © {new Date().getFullYear()}
              </p>
          </div>
      </footer>
    </div>
  );
};
