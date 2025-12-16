
import { useMemo } from 'react';
import { JournalEntry } from '../../../../types';
import { useOnboarding } from '../../../../hooks/useOnboarding';
import { t } from '../../../../services/i18n';

interface Props {
    entries: JournalEntry[];
    searchQuery: string;
}

export const useMainNavigator = ({ entries, searchQuery }: Props) => {
    const onboarding = useOnboarding('initial_prompt');
    
    const filteredEntries = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return entries.filter(e => {
            const name = (e.project || t('untitled', 'project')).toLowerCase();
            const tags = (e.tags || []).join(' ').toLowerCase();
            return !query || name.includes(query) || tags.includes(query);
        });
    }, [entries, searchQuery]);

    return {
        onboarding,
        filteredEntries
    };
};
