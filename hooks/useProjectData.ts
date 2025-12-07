
import { useState, useEffect } from 'react';
import { JournalEntry, AppSettings, User } from '../types';
import { dbFacade } from '../services/dbFacade';
import { authService } from '../services/authService';
import { toast } from '../services/toastService';
import { getLanguage, setLanguage } from '../services/i18n';

export const useProjectData = () => {
    const [user, setUser] = useState<User | null>(null);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedProject, setSelectedProject] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);
    
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
        }
    });

    useEffect(() => {
        (async () => {
            try {
                await dbFacade.init();
                
                // Load Data
                const projects = await dbFacade.getAllProjects();
                const currentUser = await authService.getCurrentUser();
                const savedSettingsStr = await dbFacade.getConfig('app_settings');

                setEntries(projects);
                setUser(currentUser);
                
                if (savedSettingsStr) {
                    try {
                        const savedSettings = JSON.parse(savedSettingsStr);
                        setSettings(prev => ({ 
                            ...prev, 
                            ...savedSettings,
                            memory: { ...prev.memory, ...(savedSettings.memory || {}) }
                        }));
                        if (savedSettings.language) setLanguage(savedSettings.language);
                    } catch (e) {
                        console.error("Failed to parse settings", e);
                    }
                }

            } catch(e) { 
                console.error(e); 
                toast.error("Failed to load data");
            } finally { 
                setLoading(false); 
            }
        })();
    }, []);

    const saveSettings = (s: AppSettings) => { 
        setSettings(s); 
        if(s.language !== settings.language) setLanguage(s.language);
        // Persist to DB
        dbFacade.setConfig('app_settings', JSON.stringify(s)).catch(console.error);
    };

    const handleUserUpdate = (u: User | null) => {
        setUser(u);
        if (u) {
            dbFacade.updateUser(u).catch(e => toast.error("Failed to save profile"));
        }
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
        settings, 
        saveSettings, 
        createEntry, 
        updateEntry, 
        deleteEntry 
    };
};