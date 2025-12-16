
import React from 'react';
import { ViewMode, JournalEntry, AppSettings, User } from '../../../../types';
import { useMainNavigator } from './useMainNavigator.hook';
import { MainNavigatorView } from './MainNavigator.view';

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

export const MainNavigator: React.FC<Props> = (props) => {
    const hook = useMainNavigator(props);

    return (
        <MainNavigatorView
            {...props}
            onboarding={hook.onboarding}
            filteredEntries={hook.filteredEntries}
        />
    );
};
