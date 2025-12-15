
import React from 'react';
import { Layout } from '../components/ui/Layout';
import { WorkspaceView } from '../features/workspace/WorkspaceView';
import { AuthViews } from '../features/auth/AuthViews';
import { MainNavigator } from '../features/navigation/MainNavigator';
import { ToastContainer } from '../components/ui/ToastContainer';
import { DialogContainer } from '../components/ui/DialogContainer';
import { LoadingScreen } from '../features/common/LoadingScreen';
import { AppSettings, JournalEntry, User } from '../types';

interface AppViewProps {
    loading: boolean;
    loadingMessage: string;
    user: User | null;
    onLogin: (user: User) => void;
    selectedProject: JournalEntry | null;
    settings: AppSettings;
    updateEntry: (entry: JournalEntry) => void;
    closeWorkspace: () => void;
    saveSettings: (s: AppSettings) => void;
    currentView: string;
    setCurrentView: (view: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    onLanguageChange: (lang: 'en' | 'es') => void;
    onLogout: () => void;
    entries: JournalEntry[];
    createEntry: (e: JournalEntry) => void;
    deleteEntry: (id: string) => void;
    selectProject: (e: JournalEntry) => void;
    setUser: (u: User | null) => void;
    searchQuery: string;
    setSearch: (s: string) => void;
    isOffline: boolean;
    setIsOffline: (isOffline: boolean) => void;
}

export const AppView: React.FC<AppViewProps> = ({
    loading, loadingMessage, user, onLogin, selectedProject, settings,
    updateEntry, closeWorkspace, saveSettings, currentView, setCurrentView,
    // FIX: Removed duplicate `updateEntry` identifier.
    onLanguageChange, onLogout, entries, createEntry, deleteEntry,
    selectProject, setUser, searchQuery, setSearch, isOffline, setIsOffline
}) => {
    if (loading) {
        return <LoadingScreen message={loadingMessage} />;
    }

    if (!user) {
        return <><AuthViews onLogin={onLogin} /><ToastContainer /><DialogContainer /></>;
    }

    if (selectedProject) {
        return (
            <>
                <WorkspaceView
                    entry={selectedProject}
                    settings={settings}
                    onUpdate={updateEntry}
                    onClose={closeWorkspace}
                    onSaveSettings={saveSettings}
                    isOffline={isOffline}
                    setIsOffline={setIsOffline}
                />
                <ToastContainer /><DialogContainer />
            </>
        );
    }

    return (
        <Layout
            currentView={currentView}
            onNavigate={setCurrentView}
            language={settings.language}
            onLanguageChange={onLanguageChange}
            user={user}
            onLogout={onLogout}
        >
            <ToastContainer /><DialogContainer />
            <MainNavigator
                view={currentView as any}
                user={user}
                entries={entries}
                settings={settings}
                searchQuery={searchQuery}
                actions={{
                    createEntry: createEntry,
                    updateEntry: updateEntry,
                    deleteEntry: deleteEntry,
                    selectProject: selectProject,
                    updateUser: setUser,
                    saveSettings: saveSettings,
                    setSearch: setSearch
                }}
            />
        </Layout>
    );
};