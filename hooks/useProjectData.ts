
import { useState, useEffect, useMemo } from 'react';
import { JournalEntry, AppSettings, User } from '../types';
import { dbFacade } from '../services/dbFacade';
// FIX: Corrected import path for authService
import { authService } from '../services/auth';
import { toast } from '../services/toastService';
import { getLanguage, setLanguage, t, initI18n } from '../services/i18n';

export const useProjectData = () => {
    const [user, setUser] = useState<User | null>(null);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedProject, setSelectedProject] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading Lumina Studio...');
    const [sessionRole, setSessionRole] = useState<'designer' | 'programmer' | null>(null);
    
    const [settings, setSettings] = useState<AppSettings>({ 
        language: getLanguage(), 
        aiModel: 'flash', 
        theme: 'dark', 
        zoomLevel: 1, 
        thinkingBudget: 'medium', 
        contextSize: 'default', 
        autoApprove: false, 
        autoFix: false, 
        mcpServers: [], 
        customProviders: [], 
        telemetryId: '',
        memory: {
            enabled: false
        },
        developerMode: false,
        learningMode: false,
        modelPriority: [],
        systemContextOverride: ''
    });

    useEffect(() => {
        (async () => {
            try {
                await initI18n(); // Load translations first

                setLoadingMessage(t('loading.db', 'common'));
                await dbFacade.init();
                
                setLoadingMessage(t('loading.engine', 'common'));
                const projects = await dbFacade.getAllProjects();
                const currentUser = await authService.getCurrentUser();
                const savedSettingsStr = await dbFacade.getConfig('app_settings');

                setEntries(projects);
                setUser(currentUser);
                
                if (savedSettingsStr) {
                    try {
                        const savedSettings = JSON.parse(savedSettingsStr);
                        if (savedSettings.language) setLanguage(savedSettings.language);
                        setSettings(prev => ({ ...prev, ...savedSettings, language: getLanguage(), memory: { ...prev.memory, ...(savedSettings.memory || {}) } }));
                    } catch (e) { console.error("Failed to parse settings", e); }
                }

                 // Check for URL params for collaboration
                const params = new URLSearchParams(window.location.search);
                const projectId = params.get('projectId');
                const role = params.get('role');

                if (role === 'designer' || role === 'programmer') {
                    setSessionRole(role);
                    toast.info(`Entering project as ${role}.`);
                }

                if (projectId) {
                    const projectToLoad = projects.find(p => p.id === projectId);
                    if (projectToLoad) {
                        setSelectedProject(projectToLoad);
                    } else {
                        toast.error("Project from invitation link not found.");
                    }
                    // Clean URL to avoid re-triggering on hot-reloads
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

            } catch(e) { 
                console.error(e); 
                toast.error("Failed to load data");
            } finally { 
                await new Promise(r => setTimeout(r, 500)); // Perceived performance
                setLoading(false); 
            }
        })();
    }, []);

    const effectiveSettings = useMemo(() => {
        const devMode = sessionRole ? sessionRole === 'programmer' : settings.developerMode;
        return { ...settings, developerMode: devMode };
    }, [settings, sessionRole]);

    const saveSettings = (s: AppSettings) => { 
        setSettings(s); 
        if(s.language !== settings.language) setLanguage(s.language);
        dbFacade.setConfig('app_settings', JSON.stringify(s)).catch(console.error);
    };

    const handleUserUpdate = (u: User | null) => {
        setUser(u);
        if (u) dbFacade.updateUser(u).catch(e => toast.error("Failed to save profile"));
    };

    const createEntry = async (e: JournalEntry) => { 
        await dbFacade.saveProject(e); 
        setEntries(await dbFacade.getAllProjects()); 
        setSelectedProject(e); 
    };

    const updateEntry = async (e: JournalEntry) => { 
        await dbFacade.saveProject(e); 
        setEntries(p => p.map(x => x.id===e.id?e:x)); 
        if(selectedProject?.id===e.id) setSelectedProject(e); 
    };

    const deleteEntry = async (id: string) => { 
        await dbFacade.deleteProject(id); 
        setEntries(p => p.filter(x => x.id!==id)); 
        if(selectedProject?.id===id) setSelectedProject(null); 
        toast.success("Deleted"); 
    };

    return { 
        user, 
        setUser: handleUserUpdate, 
        entries, 
        selectedProject, 
        setSelectedProject, 
        loading, 
        loadingMessage,
        settings: effectiveSettings, 
        saveSettings, 
        createEntry, 
        updateEntry, 
        deleteEntry 
    };
};