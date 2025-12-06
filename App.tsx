
import React, { useState } from 'react';
import { Layout } from './components/ui/Layout';
import { WorkspaceView } from './features/workspace/WorkspaceView';
import { AuthViews } from './features/auth/AuthViews';
import { MainNavigator } from './features/navigation/MainNavigator';
import { ToastContainer } from './components/ui/ToastContainer';
import { DialogContainer } from './components/ui/DialogContainer';
import { useProjectData } from './hooks/useProjectData';
import { authService } from './services/authService';

/**
 * Root Application Component.
 * Orchestrates Global Providers, Authentication State, and View Routing.
 */
const App: React.FC = () => {
  // Global Data Hook (User, Projects, Settings)
  const data = useProjectData();
  const [currentView, setCurrentView] = useState('builder');
  const [search, setSearch] = useState('');

  if (data.loading) {
      return <div className="h-screen flex items-center justify-center text-slate-500 animate-pulse">Loading Lumina Studio...</div>;
  }

  // Auth Guard
  if (!data.user) {
      return <><AuthViews onLogin={data.setUser}/><ToastContainer/><DialogContainer/></>;
  }

  // Workspace Mode (Exclusive View)
  if (data.selectedProject) {
      return (
          <>
            <WorkspaceView 
                entry={data.selectedProject} 
                settings={data.settings} 
                onUpdate={data.updateEntry} 
                onClose={() => data.setSelectedProject(null)} 
            />
            <ToastContainer/><DialogContainer/>
          </>
      );
  }

  // Main Dashboard Layout
  return (
    <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView as any} 
        language={data.settings.language} 
        onLanguageChange={l => data.saveSettings({...data.settings, language: l})} 
        user={data.user} 
        onLogout={() => { authService.logout(); data.setUser(null); }}
    >
      <ToastContainer /><DialogContainer />
      <MainNavigator 
          view={currentView as any} 
          user={data.user}
          entries={data.entries} 
          settings={data.settings}
          searchQuery={search}
          actions={{
              createEntry: data.createEntry,
              updateEntry: data.updateEntry,
              deleteEntry: data.deleteEntry,
              selectProject: data.setSelectedProject,
              updateUser: data.setUser,
              saveSettings: data.saveSettings,
              setSearch: setSearch
          }}
      />
    </Layout>
  );
};
export default App;
