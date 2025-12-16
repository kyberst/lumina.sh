
import React from 'react';
import { ViewMode, JournalEntry, AppSettings, User } from '../../../../types';
import { JournalInput } from '../../../journal/JournalInput';
import { EntryCard } from '../../../journal/EntryCard';
import { SettingsView } from '../../../settings/SettingsView';
import { ProfileView } from '../../../profile/ProfileView';
import { t } from '../../../../services/i18n';
import { OnboardingOverlay, Step } from '../../../../components/ui/OnboardingOverlay';

interface Props {
    view: ViewMode;
    user: User;
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
    onboarding: any; // from useOnboarding hook
    filteredEntries: JournalEntry[];
}

const ONBOARDING_STAGE1_STEPS: Step[] = [
    { target: '[data-tour="main-prompt"]', titleKey: 'initialPromptTitle', descKey: 'initialPromptDesc', position: 'bottom' }
];

export const MainNavigatorView: React.FC<Props> = ({ view, settings, actions, user, searchQuery, onboarding, filteredEntries }) => {

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
                <JournalInput 
                    onEntryCreated={actions.createEntry} 
                    settings={settings} 
                    onSaveSettings={actions.saveSettings}
                />
            </div>
        );
    }

    if (view === 'projects') {
        return (
            <div className="max-w-6xl mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold">{t('projectsTitle', 'project')} ({filteredEntries.length})</h2>
                    <input 
                        className="shadcn-input w-full sm:w-64" 
                        placeholder={t('search', 'common')} 
                        value={searchQuery} 
                        onChange={e => actions.setSearch(e.target.value)} 
                    />
                </div>
                
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <p>{t('noProjectsFound', 'project').replace('{query}', searchQuery)}</p>
                        <button onClick={() => actions.setSearch('')} className="text-indigo-600 font-bold mt-2 hover:underline">{t('clearSearch', 'project')}</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEntries.map(e => (
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
        // The entries prop is needed for the model failover dropdown.
        return <SettingsView settings={settings} onSave={actions.saveSettings} entries={filteredEntries} />;
    }

    return null;
};
