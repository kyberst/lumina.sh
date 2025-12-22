import React from 'react';
import { ViewMode, JournalEntry, AppSettings } from '../../types';
import { JournalInput } from '../journal/JournalInput';
import { EntryCard } from '../journal/EntryCard';
import { SettingsView } from '../settings/SettingsView';
import { t } from '../../services/i18n';

interface Props {
    view: ViewMode;
    entries: JournalEntry[];
    settings: AppSettings;
    actions: {
        createEntry: (e: JournalEntry) => Promise<void>;
        updateEntry: (e: JournalEntry) => void;
        deleteEntry: (id: string) => void;
        selectProject: (e: JournalEntry) => void; 
        saveSettings: (s: AppSettings) => void;
        resetEverything: () => void;
        clearProjects: () => void;
        setSearch: (s: string) => void;
    };
    searchQuery: string;
}

export const MainNavigator: React.FC<Props> = ({ view, entries, settings, actions, searchQuery }) => {
    
    if (view === 'builder') {
        return (
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center animate-in fade-in slide-in-from-top-8">
                    <h1 className="text-5xl font-extrabold text-slate-900 mb-4">{t('prompt', 'builder')}</h1>
                    <p className="text-slate-500 text-xl">{t('placeholder', 'builder')}</p>
                </header>
                <JournalInput onEntryCreated={actions.createEntry} settings={settings} />
            </div>
        );
    }

    if (view === 'projects') {
        const query = searchQuery.toLowerCase().trim();
        const filtered = entries.filter(e => {
            const name = (e.project || 'Untitled App').toLowerCase();
            const tags = (e.tags || []).join(' ').toLowerCase();
            return !query || name.includes(query) || tags.includes(query);
        });

        return (
            <div className="max-w-6xl mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold">{t('projectsTitle', 'nav')} ({filtered.length})</h2>
                    <input 
                        className="shadcn-input w-full sm:w-64" 
                        placeholder={t('search', 'common')} 
                        value={searchQuery} 
                        onChange={e => actions.setSearch(e.target.value)} 
                    />
                </div>
                
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <p>{t('noProjects', 'nav')} "{searchQuery}"</p>
                        <button onClick={() => actions.setSearch('')} className="text-indigo-600 font-bold mt-2 hover:underline">{t('clearSearch', 'nav')}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(e => (
                            <div key={e.projects_id}>
                                <EntryCard 
                                    entry={e} 
                                    onDelete={actions.deleteEntry} 
                                    onSelect={() => actions.selectProject(e)} 
                                    onTagClick={actions.setSearch} 
                                    onUpdate={actions.updateEntry} 
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (view === 'settings') {
        return <SettingsView 
            settings={settings} 
            onSave={actions.saveSettings} 
            onReset={actions.resetEverything} 
            onClearProjects={actions.clearProjects}
        />;
    }

    return null;
};