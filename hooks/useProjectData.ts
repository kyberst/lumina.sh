
import { useState, useEffect } from 'react';
import { JournalEntry, AppSettings, User } from '../types';
import { sqliteService } from '../services/sqliteService';
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
            enabled: false,
            qdrantUrl: 'http://localhost:6333',
            neo4jUrl: 'http://localhost:7474'
        }
    });

    useEffect(() => {
        (async () => {
            try {
                await sqliteService.init();
                
                // Load Data
                const projects = await sqliteService.getAllProjects();
                const currentUser = await authService.getCurrentUser();
                const savedSettingsStr = await sqliteService.getConfig('app_settings');

                setEntries(projects);
                setUser(currentUser);
                
                if (savedSettingsStr) {
                    try {
                        const savedSettings = JSON.parse(savedSettingsStr);
                        // Deep merge for nested memory settings
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
        sqliteService.setConfig('app_settings', JSON.stringify(s)).catch(console.error);
    };

    const handleUserUpdate = (u: User | null) => {
        setUser(u);
        if (u) {
            sqliteService.updateUser(u).catch(e => toast.error("Failed to save profile"));
        }
    };

    const createEntry = async (e: JournalEntry) => { 
        await sqliteService.saveProject(e); 
        setEntries(await sqliteService.getAllProjects()); 
        setSelectedProject(e); 
    };

    const updateEntry = async (e: JournalEntry) => { 
        await sqliteService.saveProject(e); 
        setEntries(p => p.map(x => x.id===e.id?e:x)); 
        if(selectedProject?.id===e.id) setSelectedProject(e); 
    };

    const deleteEntry = async (id: string) => { 
        await sqliteService.deleteProject(id); 
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