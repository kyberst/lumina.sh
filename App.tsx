
import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { JournalInput } from './features/journal/JournalInput';
import { EntryCard } from './features/journal/EntryCard';
import { SettingsView } from './features/settings/SettingsView';
import { WorkspaceView } from './features/workspace/WorkspaceView';
import { AuthViews } from './features/auth/AuthViews';
import { ProfileView } from './features/profile/ProfileView';
import { JournalEntry, AppModule, ViewMode, AppSettings, User } from './types';
import { logger } from './services/logger';
import { t, getLanguage, setLanguage } from './services/i18n';
import { sqliteService } from './services/sqliteService';
import { authService } from './services/authService';
import { ToastContainer } from './components/ui/ToastContainer';
import { toast } from './services/toastService';

const SETTINGS_KEY = 'umbra_dyad_settings';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('builder');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<JournalEntry | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    language: getLanguage(), 
    aiModel: 'flash',
    theme: 'dark', // Legacy key
    zoomLevel: 1.0,
    thinkingBudget: 'medium',
    contextSize: 'default',
    autoApprove: false,
    autoFix: false,
    mcpServers: [],
    customProviders: [],
    telemetryId: '14369529-e517-45ab-948c-997201272fd8'
  });

  const [mounted, setMounted] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  useEffect(() => {
    const initData = async () => {
      try {
        await sqliteService.init();
        const loadedEntries = await sqliteService.getAllProjects();
        setEntries(loadedEntries);
        
        // Auth Check
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed } as AppSettings));
                if (parsed.language && (parsed.language === 'en' || parsed.language === 'es') && parsed.language !== getLanguage()) {
                    setLanguage(parsed.language as 'en' | 'es');
                }
            } catch (parseErr) {
                console.warn("Failed to parse settings", parseErr);
            }
        }
      } catch (e) {
        logger.error(AppModule.CORE, 'Failed to initialize app data', e);
      } finally {
        setIsLoadingDB(false);
        setMounted(true);
      }
    };
    initData();
  }, []);

  useEffect(() => {
      const root = document.getElementById('root');
      if (root) {
          root.style.transform = `scale(${settings.zoomLevel})`;
          root.style.transformOrigin = 'top center';
          root.style.height = `${100 / settings.zoomLevel}vh`;
          root.style.width = `${100 / settings.zoomLevel}vw`;
          if(settings.zoomLevel < 1) {
             root.style.marginLeft = `${(1 - settings.zoomLevel) * 50}vw`; 
          } else {
             root.style.marginLeft = '0';
          }
      }
  }, [settings.zoomLevel]);

  const saveSettings = (newSettings: AppSettings) => {
    if (newSettings.language !== settings.language) {
        setLanguage(newSettings.language);
    }
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleLanguageChange = (lang: 'en' | 'es') => {
      const newSettings: AppSettings = { ...settings, language: lang };
      saveSettings(newSettings);
  };

  const handleCreateEntry = async (entry: JournalEntry) => {
    try {
      await sqliteService.saveProject(entry);
      const updated = await sqliteService.getAllProjects();
      setEntries(updated);
      setSelectedProject(entry);
    } catch (e) {
      logger.error(AppModule.CORE, 'Save failed', e);
    }
  };

  const handleUpdateEntry = async (updatedEntry: JournalEntry) => {
    try {
      await sqliteService.saveProject(updatedEntry);
      setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
      if (selectedProject?.id === updatedEntry.id) {
        setSelectedProject(updatedEntry);
      }
    } catch (e) {
      logger.error(AppModule.CORE, 'Update failed', e);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm(t('delete') + '?')) return;
    try {
      setEntries(prev => prev.filter(e => e.id !== id));
      if (selectedProject?.id === id) {
          setSelectedProject(null);
      }
      await sqliteService.deleteProject(id);
      toast.success("Project deleted successfully");
    } catch (e) {
      logger.error(AppModule.CORE, 'Delete failed', e);
      toast.error("Failed to delete project");
      const loadedEntries = await sqliteService.getAllProjects();
      setEntries(loadedEntries);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setCurrentView('projects');
  };

  const handleLogin = (u: User) => {
      setUser(u);
      setCurrentView('builder');
  };

  const handleLogout = () => {
      authService.logout();
      setUser(null);
  };

  if (!mounted || isLoadingDB) {
    return (
      <div className="min-h-screen bg-[#ffffbb] flex flex-col items-center justify-center text-[#ff7e15] font-sans">
        <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-4 border-[#ffff7e] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#ff7e15] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="mt-6 text-sm font-bold uppercase tracking-widest text-[#ffc93a]">Loading Studio...</div>
      </div>
    );
  }

  // --- AUTH FLOW ---
  if (!user) {
      return (
          <>
            <AuthViews onLogin={handleLogin} />
            <ToastContainer />
          </>
      );
  }

  // --- MAIN APP ---
  if (selectedProject) {
    return (
      <>
        <WorkspaceView 
          entry={selectedProject} 
          settings={settings}
          onUpdate={handleUpdateEntry} 
          onClose={() => setSelectedProject(null)} 
        />
        <ToastContainer />
      </>
    );
  }

  const filteredEntries = entries.filter(e => {
    const query = searchQuery.toLowerCase();
    return (
      (e.prompt && e.prompt.toLowerCase().includes(query)) || 
      (e.description && e.description.toLowerCase().includes(query)) ||
      e.tags.some(t => t.toLowerCase().includes(query)) ||
      (e.project && e.project.toLowerCase().includes(query))
    );
  });

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView} 
      language={settings.language}
      onLanguageChange={handleLanguageChange}
      user={user}
      onLogout={handleLogout}
    >
      <ToastContainer />
      
      {currentView === 'builder' && (
        <div className="max-w-4xl mx-auto w-full">
          <header className="mb-12 text-center animate-in fade-in slide-in-from-top-8 duration-700">
            <div className="inline-block mb-4 px-4 py-1.5 bg-[#ffff7e]/50 border border-[#ffc93a] rounded-full text-[#ff7e15] text-xs font-bold uppercase tracking-wider">
                AI Powered App Builder
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-4 font-['Plus_Jakarta_Sans'] leading-tight">
              {t('prompt', 'builder')}
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">{t('placeholder', 'builder')}</p>
          </header>
          <JournalInput onEntryCreated={handleCreateEntry} settings={settings} />
        </div>
      )}

      {currentView === 'projects' && (
        <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-500">
           <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 border-b border-[#ffc93a]/30 pb-6 sticky top-20 bg-[#ffffbb]/80 backdrop-blur-md z-20 pt-4 px-2">
             <div className="flex items-center gap-3 mb-4 sm:mb-0">
                <div className="bg-[#ffff7e] text-[#ff7e15] p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-['Plus_Jakarta_Sans']">
                {t('memories', 'nav')} <span className="text-slate-400 text-lg font-medium ml-1">({filteredEntries.length})</span>
                </h2>
             </div>
             
             <div className="relative group w-full sm:w-auto">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffc93a] group-focus-within:text-[#ff7e15] transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               </div>
               <input 
                 type="text" 
                 placeholder={t('search')}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-white border-2 border-[#ffff7e] text-sm font-medium text-slate-700 rounded-2xl py-2.5 pl-10 pr-10 w-full sm:w-64 focus:outline-none focus:border-[#ff7e15] focus:ring-4 focus:ring-[#ffc93a]/20 transition-all placeholder:text-slate-400 shadow-sm"
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#ff2935] transition-colors" title="Clear Search">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
               )}
             </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
             {filteredEntries.map(entry => (
               <EntryCard 
                 key={entry.id} 
                 entry={entry} 
                 onDelete={handleDeleteEntry}
                 onSelect={() => setSelectedProject(entry)}
                 onTagClick={handleTagClick}
                 onUpdate={handleUpdateEntry}
               />
             ))}
             {filteredEntries.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-24 text-center border-4 border-dashed border-[#ffc93a]/30 rounded-[3rem] bg-white/50">
                 <div className="bg-[#ffff7e] p-6 rounded-full mb-6 text-[#ff7e15]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">No projects found</h3>
                 <p className="text-slate-500 font-medium mb-6">Your canvas is empty. Start creating something amazing!</p>
                 <button onClick={() => setCurrentView('builder')} className="px-6 py-3 bg-[#ff7e15] hover:bg-[#ff2935] text-white rounded-xl font-bold shadow-lg shadow-[#ffc93a]/50 transition-all hover:-translate-y-1">
                    Start New Project
                 </button>
               </div>
             )}
           </div>
        </div>
      )}

      {currentView === 'profile' && user && (
          <ProfileView user={user} onUpdateUser={setUser} />
      )}

      {currentView === 'settings' && (
        <SettingsView settings={settings} onSave={saveSettings} entries={entries} />
      )}

    </Layout>
  );
};

export default App;
