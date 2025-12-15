
import React from 'react';
import { ViewMode, JournalEntry, AppSettings, User } from '../../types';
import { JournalInput } from '../journal/JournalInput';
import { EntryCard } from '../journal/EntryCard';
import { SettingsView } from '../settings/SettingsView';
import { ProfileView } from '../profile/ProfileView';
import { t } from '../../services/i18n';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingOverlay, Step } from '../../components/ui/OnboardingOverlay';

interface Props {
    view: ViewMode;
    user: User;
    entries: JournalEntry[];
    settings: AppSettings;
    actions: {
        createEntry: (e: JournalEntry) => void;
        updateEntry: (e: JournalEntry) => void;
        deleteEntry: (id: string) => void;
        selectProject: (e: JournalEntry) => void;
        updateUser: (u: User) => void;
        saveSettings: (s: AppSettings) => void;
        setSearch: (s: string) => void;
    };
    searchQuery: string;
}

const ONBOARDING_STAGE1_STEPS: Step[] = [
    { target: '[data-tour="main-prompt"]', titleKey: 'initialPromptTitle', descKey: 'initialPromptDesc', position: 'bottom' }
];

export const MainNavigator: React.FC<Props> = ({ view, entries, settings, actions, user, searchQuery }) => {
    const onboarding = useOnboarding('initial_prompt');

    if (view === 'builder') {
        return (
            <div className="max-w-4xl mx-auto">
                {onboarding.isActive && (
                    <OnboardingOverlay 
                        steps={ONBOARDING_STAGE1_STEPS} 
                        currentStep={onboarding.currentStep}
                        onNext={onboarding.next}
                        onFinish={onboarding.finish}
                        onSkip={onboarding.skip}
                    />
                )}
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
                    <h2 className="text-2xl font-bold">Projects ({filtered.length})</h2>
                    <input 
                        className="shadcn-input w-full sm:w-64" 
                        placeholder="Search projects..." 
                        value={searchQuery} 
                        onChange={e => actions.setSearch(e.target.value)} 
                    />
                </div>
                
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <p>No projects found matching "{searchQuery}"</p>
                        <button onClick={() => actions.setSearch('')} className="text-indigo-600 font-bold mt-2 hover:underline">Clear Search</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(e => (
                            <div key={e.id} className="h-64">
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

    if (view === 'profile') {
        return <ProfileView user={user} onUpdateUser={actions.updateUser} />;
    }

    if (view === 'settings') {
        return <SettingsView settings={settings} onSave={actions.saveSettings} entries={entries} />;
    }

    return null;
};