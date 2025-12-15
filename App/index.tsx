
import React from 'react';
import { useApp } from '../hooks/useApp.hook';
import { AppView } from './App.view';

const App: React.FC = () => {
    const hook = useApp();

    return <AppView
        loading={hook.loading}
        loadingMessage={hook.loadingMessage}
        user={hook.user}
        onLogin={hook.setUser}
        selectedProject={hook.selectedProject}
        settings={hook.settings}
        updateEntry={hook.updateEntry}
        closeWorkspace={hook.handleCloseWorkspace}
        saveSettings={hook.saveSettings}
        currentView={hook.currentView}
        setCurrentView={hook.setCurrentView}
        onLanguageChange={hook.handleLanguageChange}
        onLogout={hook.handleLogout}
        entries={hook.entries}
        createEntry={hook.createEntry}
        deleteEntry={hook.deleteEntry}
        selectProject={hook.setSelectedProject}
        setUser={hook.setUser}
        searchQuery={hook.search}
        setSearch={hook.setSearch}
        isOffline={hook.isOffline}
        setIsOffline={hook.setIsOffline}
    />;
};

export default App;