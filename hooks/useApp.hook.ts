
import { useState, useCallback } from 'react';
import { useProjectData } from './useProjectData';
import { authService } from '../services/auth';
import { usePageVisibility } from './usePageVisibility';
import { toast } from '../services/toastService';
import { t } from '../services/i18n';

export const useApp = () => {
    const data = useProjectData();
    const [currentView, setCurrentView] = useState('builder');
    const [search, setSearch] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    const handleLogout = useCallback(() => {
        authService.logout();
        data.setUser(null);
    }, [data]);
    
    const handleLanguageChange = (lang: 'en' | 'es') => {
        data.saveSettings({ ...data.settings, language: lang });
    };
    
    const handleCloseWorkspace = () => {
        data.setSelectedProject(null);
    };

    // Security: Revalidate session when user returns to the tab
    usePageVisibility(async () => {
        if (data.user) {
            const isValid = await authService.validateSession();
            if (!isValid) {
                console.warn('[Security] Session expired in background. Logging out.');
                toast.info(t('error.sessionExpired', 'auth'));
                handleLogout();
            }
        }
    }, !!data.user); // Pass boolean indicating if user is loaded

    return {
        ...data,
        currentView,
        setCurrentView,
        search,
        setSearch,
        isOffline,
        setIsOffline,
        handleLogout,
        handleLanguageChange,
        handleCloseWorkspace
    };
};
