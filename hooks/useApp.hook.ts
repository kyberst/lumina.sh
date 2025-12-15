
import { useState } from 'react';
import { useProjectData } from './useProjectData';
import { authService } from '../services/auth';

export const useApp = () => {
    const data = useProjectData();
    const [currentView, setCurrentView] = useState('builder');
    const [search, setSearch] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    const handleLogout = () => {
        authService.logout();
        data.setUser(null);
    };
    
    const handleLanguageChange = (lang: 'en' | 'es') => {
        data.saveSettings({ ...data.settings, language: lang });
    };
    
    const handleCloseWorkspace = () => {
        data.setSelectedProject(null);
    };

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