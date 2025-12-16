
import { useState, useEffect, useMemo } from 'react';
import { JournalEntry, AppSettings, User, Snapshot, ChatMessage } from '../types';
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
                    toast.info(t('enteringAsRole', 'project').replace('{role}', role));
                }

                if (projectId) {
                    const projectToLoad = projects.find(p => p.id === projectId);
                    if (projectToLoad) {
                        setSelectedProject(projectToLoad);
                    } else {
                        toast.error(t('inviteNotFound', 'project'));
                    }
                    // Clean URL to avoid re-triggering on hot-reloads
                    window.history.replaceState({}, document.title, window.location.pathname);
                }

            } catch(e) { 
                console.error(e); 
                toast.error(t('errorLoadData', 'common'));
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
        let entryToSave = { ...e };
        const currentEntry = entries.find(p => p.id === e.id);

        if (currentEntry) {
            // If project name changed, log it to the project's chat history
            if (currentEntry.project !== e.project) {
                const chatMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'model', // System-generated message
                    text: `Project renamed from "${currentEntry.project || t('untitled', 'project')}" to "${e.project || t('untitled', 'project')}".`,
                    timestamp: Date.now(),
                    applied: true, // This is a record of an action that has already occurred
                };
                // This doesn't need to be awaited as it's a background logging task
                dbFacade.saveRefactorMessage(e.id, chatMessage).catch(console.error);
            }

            // Check for file changes to determine if we need a snapshot
            const filesChanged = JSON.stringify(currentEntry.files) !== JSON.stringify(e.files);
            
            if (filesChanged) {
                const newSnapshot: Snapshot = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    description: `${t('checkpoint', 'builder')} ${new Date().toLocaleTimeString()}`,
                    files: currentEntry.files
                };
                
                const existingHistory = currentEntry.history || [];
                // Prepend new snapshot, limit to 50
                entryToSave.history = [newSnapshot, ...existingHistory].slice(0, 50);
            } else {
                // If files didn't change (e.g. metadata update), preserve existing history
                // Note: 'e' might not have history if it came from a partial update source, so use currentEntry's history
                entryToSave.history = currentEntry.history;
            }
        }

        await dbFacade.saveProject(entryToSave); 
        setEntries(p => p.map(x => x.id===entryToSave.id?entryToSave:x)); 
        if(selectedProject?.id===entryToSave.id) setSelectedProject(entryToSave); 
    };

    const deleteEntry = async (id: string) => { 
        await dbFacade.deleteProject(id); 
        setEntries(p => p.filter(x => x.id!==id)); 
        if(selectedProject?.id===id) setSelectedProject(null); 
        toast.success(t('deleted', 'common')); 
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
