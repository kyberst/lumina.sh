import React from 'react';
import { t, Lang } from '../../services/i18n';
import { ViewMode } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: ViewMode) => void;
  language?: Lang;
  onLanguageChange?: (lang: Lang) => void;
  onStartTutorial?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onStartTutorial }) => {
  const navItemClass = (view: string) => 
    `relative flex items-center gap-2 text-sm font-semibold transition-all px-4 py-2 rounded-full overflow-hidden shrink-0 group ${
      currentView === view 
        ? 'text-primary-foreground shadow-md shadow-primary/25' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`;

  const activeBackground = "absolute inset-0 bg-primary z-0";

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-background">
      
      {/* Ambient Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0"></div>

      {/* Navbar - Glassmorphic & Floating */}
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl glass-panel h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm transition-all border border-white/20">
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onNavigate('builder')}>
          <div className="w-9 h-9 bg-foreground text-background rounded-lg shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
            <span className="font-bold text-lg tracking-tighter">Lu</span>
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block tracking-tight font-['Plus_Jakarta_Sans']">
            lumina<span className="text-primary">.sh</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Scrollable Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 px-2 max-w-[calc(100vw-160px)] sm:max-w-none">
            <button onClick={() => onNavigate('builder')} className={navItemClass('builder')}>
              {currentView === 'builder' && <div className={activeBackground}></div>}
              <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  <span className="hidden md:inline">{t('journal', 'nav')}</span>
              </span>
            </button>
            <button onClick={() => onNavigate('projects')} className={navItemClass('projects')}>
               {currentView === 'projects' && <div className={activeBackground}></div>}
               <span className="relative z-10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  <span className="hidden md:inline">{t('memories', 'nav')}</span>
               </span>
            </button>
            
            <div className="w-px h-6 bg-border mx-1 sm:mx-2 hidden sm:block"></div>

            {onStartTutorial && (
              <button onClick={onStartTutorial} className={`p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0`} title={t('help', 'nav')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </button>
            )}

            <button onClick={() => onNavigate('settings')} className={`p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 ${currentView === 'settings' ? 'bg-muted text-foreground' : ''}`} title={t('settings', 'nav')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-28 px-4 pb-12 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-border bg-background/50 backdrop-blur-sm mt-auto shrink-0 relative z-10">
          <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                  lumina.sh © {new Date().getFullYear()}
              </p>
          </div>
      </footer>
    </div>
  );
};