
import React, { useState } from 'react';
import { Layout } from './components/ui/Layout';
import { JournalInput } from './features/journal/JournalInput';
import { EntryCard } from './features/journal/EntryCard';
import { SettingsView } from './features/settings/SettingsView';
import { WorkspaceView } from './features/workspace/WorkspaceView';
import { AuthViews } from './features/auth/AuthViews';
import { ProfileView } from './features/profile/ProfileView';
import { ToastContainer } from './components/ui/ToastContainer';
import { DialogContainer } from './components/ui/DialogContainer';
import { useProjectData } from './hooks/useProjectData';
import { authService } from './services/authService';
import { t } from './services/i18n';

const App: React.FC = () => {
  const { user, setUser, entries, selectedProject, setSelectedProject, loading, settings, saveSettings, createEntry, updateEntry, deleteEntry } = useProjectData();
  const [currentView, setCurrentView] = useState('builder');
  const [search, setSearch] = useState('');

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <><AuthViews onLogin={setUser}/><ToastContainer/><DialogContainer/></>;
  if (selectedProject) return <><WorkspaceView entry={selectedProject} settings={settings} onUpdate={updateEntry} onClose={() => setSelectedProject(null)} /><ToastContainer/><DialogContainer/></>;

  const filtered = entries.filter(e => e.project?.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView as any} language={settings.language} onLanguageChange={l => saveSettings({...settings, language: l})} user={user} onLogout={() => { authService.logout(); setUser(null); }}>
      <ToastContainer /><DialogContainer />
      {currentView === 'builder' && (
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center animate-in fade-in slide-in-from-top-8">
            <h1 className="text-5xl font-extrabold text-slate-900 mb-4">{t('prompt', 'builder')}</h1>
            <p className="text-slate-500 text-xl">{t('placeholder', 'builder')}</p>
          </header>
          <JournalInput onEntryCreated={createEntry} settings={settings} />
        </div>
      )}
      {currentView === 'projects' && (
        <div className="max-w-6xl mx-auto">
           <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold">Projects ({filtered.length})</h2><input className="shadcn-input w-64" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{filtered.map(e => <EntryCard key={e.id} entry={e} onDelete={deleteEntry} onSelect={() => setSelectedProject(e)} onTagClick={setSearch} onUpdate={updateEntry} />)}</div>
        </div>
      )}
      {currentView === 'profile' && <ProfileView user={user} onUpdateUser={setUser} />}
      {currentView === 'settings' && <SettingsView settings={settings} onSave={saveSettings} entries={entries} />}
    </Layout>
  );
};
export default App;
