
import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { WorkspaceView } from './features/workspace/WorkspaceView';
import { MainNavigator } from './features/navigation/MainNavigator';
import { ToastContainer } from './components/ui/ToastContainer';
import { DialogContainer } from './components/ui/DialogContainer';
import { useProjectData } from './hooks/useProjectData';
import { eventBus } from './services/eventBus';
import { toast } from './services/toastService';
import { t } from './services/i18n';

/**
 * Root Application Component.
 * Orchestrates Global Providers, Authentication State, and View Routing.
 */
const App: React.FC = () => {
  // Global Data Hook (Projects, Settings)
  const data = useProjectData();
  const [currentView, setCurrentView] = useState('builder');
  const [search, setSearch] = useState('');
  const [tutorialQueued, setTutorialQueued] = useState(false);

  // Effect to handle global zoom changes
  useEffect(() => {
    (document.body.style as any).zoom = data.settings.zoomLevel.toString();
  }, [data.settings.zoomLevel]);


  const handleStartTutorial = () => {
      if (data.selectedProject) {
          eventBus.emit('start-tutorial');
      } else {
          if (data.entries.length > 0) {
              data.openProject(data.entries[0]); 
              setTutorialQueued(true);
          } else {
              toast.info("Create a project first to view the tutorial.");
          }
      }
  };
  
  useEffect(() => {
      if (tutorialQueued && data.selectedProject) {
          setTimeout(() => {
              eventBus.emit('start-tutorial');
              setTutorialQueued(false);
          }, 500);
      }
  }, [tutorialQueued, data.selectedProject]);

  if (data.loading) {
      return <div className="h-screen flex items-center justify-center text-slate-500 animate-pulse">{t('loadingApp', 'common')}</div>;
  }

  if (data.selectedProject) {
      return (
          <ErrorBoundary onReset={() => data.setSelectedProject(null)} viewName="Workspace">
            <WorkspaceView 
                entry={data.selectedProject} 
                settings={data.settings} 
                onUpdate={data.updateEntry} 
                onClose={() => data.setSelectedProject(null)} 
            />
            <ToastContainer/><DialogContainer/>
          </ErrorBoundary>
      );
  }

  return (
    <ErrorBoundary onReset={() => window.location.reload()} viewName="Dashboard">
      <Layout 
          currentView={currentView} 
          onNavigate={setCurrentView as any} 
          language={data.settings.language} 
          onLanguageChange={l => data.saveSettings({...data.settings, language: l})} 
          onStartTutorial={handleStartTutorial}
      >
        <ToastContainer /><DialogContainer />
        <MainNavigator 
            view={currentView as any} 
            entries={data.entries} 
            settings={data.settings}
            searchQuery={search}
            actions={{
                createEntry: data.createEntry,
                updateEntry: data.updateEntry,
                deleteEntry: data.deleteEntry,
                selectProject: data.openProject, 
                saveSettings: data.saveSettings,
                resetEverything: data.resetEverything,
                clearProjects: data.clearProjects,
                setSearch: setSearch
            }}
        />
      </Layout>
    </ErrorBoundary>
  );
};
export default App;
