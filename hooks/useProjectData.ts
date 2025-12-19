import { useState, useEffect } from 'react';
import { JournalEntry, AppSettings, ChatMessage } from '../types';
import { dbFacade } from '../services/dbFacade';
import { toast } from '../services/toastService';
import { getLanguage, setLanguage } from '../services/i18n';

export const useProjectData = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [selectedProject, setSelectedProject] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [settings, setSettings] = useState<AppSettings>({ 
        language: getLanguage(),
        aiModel: 'flash', 
        zoomLevel: 1, 
        thinkingBudget: 'medium', 
        contextSize: 'default', 
        autoApprove: false, 
        autoFix: false, 
        mcpServers: [], 
        customProviders: [], 
        telemetryId: '',
        memory: { enabled: false },
        releaseChannel: 'stable',
        executionEnvironment: 'local',
        telemetryEnabled: true,
        globalEnvVars: {},
        experiments: { nativeGit: false },
    });

    useEffect(() => {
        (async () => {
            try {
                await dbFacade.init();
                
                const projects = await dbFacade.getAllProjects();
                const savedSettingsStr = await dbFacade.getConfig('app_settings');
                const savedLang = await dbFacade.getConfig('app_language');

                setEntries(projects);
                
                if (savedSettingsStr) {
                    try {
                        const parsed = JSON.parse(savedSettingsStr);
                        setSettings(prev => ({ 
                            ...prev, 
                            ...parsed,
                            memory: { ...prev.memory, ...(parsed.memory || {}) },
                            experiments: { ...prev.experiments, ...(parsed.experiments || {}) },
                        }));
                    } catch (e) { console.error("Failed to parse settings", e); }
                }

                if (savedLang) {
                    setSettings(prev => ({...prev, language: savedLang as 'en' | 'es'}));
                    setLanguage(savedLang as 'en' | 'es');
                } else if (settings.language) {
                    setLanguage(settings.language);
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
        if(s.language !== getLanguage()) {
            setLanguage(s.language);
        }
        dbFacade.setConfig('app_settings', JSON.stringify(s)).catch(console.error);
    };

    const resetEverything = async () => {
        await dbFacade.clearAllData();
        toast.success("Application has been reset.");
        setTimeout(() => window.location.reload(), 1000);
    };

    const createEntry = async (e: JournalEntry) => { 
        console.log('[Lumina Project Chat] Attempting to create new project:', e.project);
        const initialMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          text: e.prompt,
          timestamp: e.timestamp,
        };
        console.log('[Lumina Project Chat] Initial message for new project received:', initialMessage.text);

        await dbFacade.atomicCreateProjectWithHistory(e, initialMessage);

        const allProjects = await dbFacade.getAllProjects();
        setEntries(allProjects);
        const newProjectFromDb = allProjects.find(p => p.id === e.id) || e;
        setSelectedProject(newProjectFromDb);
        
        console.log('[Lumina Project Chat] Successfully created and selected project:', newProjectFromDb);
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
        entries, 
        selectedProject, 
        setSelectedProject, 
        loading, 
        settings, 
        saveSettings,
        resetEverything,
        createEntry, 
        updateEntry, 
        deleteEntry 
    };
};