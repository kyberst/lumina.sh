
import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, AppSettings, ChatMessage } from '../types';
import { dbFacade } from '../services/dbFacade';
import { toast } from '../services/toastService';
import { getLanguage, setLanguage, t } from '../services/i18n';

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
        autoApprove: true, // Default: Enabled
        autoFix: true,     // Default: Enabled
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
                console.log(projects)
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
                    setSettings(prev => ({...prev, language: savedLang as any}));
                    setLanguage(savedLang);
                }

                (window as any).nukeLumina = async () => {
                    await dbFacade.clearAllData();
                    window.location.reload();
                };

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
        if(s.language !== getLanguage()) setLanguage(s.language);
        dbFacade.setConfig('app_settings', JSON.stringify(s)).catch(console.error);
    };

    const resetEverything = async () => {
        await dbFacade.clearAllData();
        toast.success("Application reset.");
        setTimeout(() => window.location.reload(), 1000);
    };

    const clearProjects = async () => {
        try {
            await dbFacade.clearProjectsOnly();
            setEntries([]);
            setSelectedProject(null);
            toast.success(t('clearWorkspaceSuccess', 'settings'));
        } catch (e) {
            toast.error("Cleanup failed.");
        }
    };

    const openProject = async (entry: JournalEntry) => {
        try {
            const cleanId = dbFacade.projects.cleanId(entry.projects_id);
            if (!cleanId) return toast.error("Invalid project identity.");
            
            setSelectedProject({ ...entry, projects_id: cleanId });
            const freshEntry = await dbFacade.getProjectById(cleanId);
            if (freshEntry) setSelectedProject(freshEntry);
        } catch (e) {
            toast.error("Could not load project.");
        }
    };

    const createEntry = async (e: JournalEntry) => { 
        const cleanId = dbFacade.projects.cleanId(e.projects_id);
        if (!cleanId) return toast.error("Failed to create project: Invalid ID");

        const initialMessage: ChatMessage = {
          refactor_history_id: crypto.randomUUID(),
          role: 'user',
          text: e.prompt,
          timestamp: e.timestamp,
        };

        try {
            const entryWithCleanId = { ...e, projects_id: cleanId };
            await dbFacade.atomicCreateProjectWithHistory(entryWithCleanId, initialMessage);
            const allProjects = await dbFacade.getAllProjects();
            setEntries(allProjects);
            setSelectedProject(entryWithCleanId);
        } catch (err: any) {
            toast.error("Project creation failed in database.");
        }
    };

    const updateEntry = async (updatedEntry: JournalEntry) => { 
        const cleanId = dbFacade.projects.cleanId(updatedEntry.projects_id) || dbFacade.projects.cleanId(selectedProject?.projects_id);
        if (!cleanId) return toast.error("Save failed: Project identity lost.");

        const finalEntry: JournalEntry = { ...updatedEntry, projects_id: cleanId };
        try {
            await dbFacade.saveProject(finalEntry); 
            if (selectedProject?.projects_id === cleanId) setSelectedProject(finalEntry); 
            setEntries(prev => {
                const idx = prev.findIndex(x => x.projects_id === cleanId);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = finalEntry;
                return next;
            });
        } catch (err: any) {
            toast.error("Failed to save changes.");
        }
    };

    const deleteEntry = async (projects_id: string) => { 
        const cleanId = dbFacade.projects.cleanId(projects_id);
        if (!cleanId) return;
        await dbFacade.deleteProject(cleanId); 
        setEntries(p => p.filter(x => x.projects_id !== cleanId)); 
        if (selectedProject?.projects_id === cleanId) setSelectedProject(null); 
        toast.success("Deleted"); 
    };

    return { 
        entries, selectedProject, openProject, setSelectedProject, loading, 
        settings, saveSettings, resetEverything, clearProjects, 
        createEntry, updateEntry, deleteEntry 
    };
};
