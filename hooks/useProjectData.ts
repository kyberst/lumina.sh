
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
            const cleanUid = dbFacade.projects.cleanId(entry.uid);
            if (!cleanUid) return toast.error("Invalid project identity.");
            
            setSelectedProject({ ...entry, uid: cleanUid });
            const freshEntry = await dbFacade.getProjectById(cleanUid);
            if (freshEntry) setSelectedProject(freshEntry);
        } catch (e) {
            toast.error("Could not load project.");
        }
    };

    const createEntry = async (e: JournalEntry) => { 
        const cleanUid = dbFacade.projects.cleanId(e.uid);
        if (!cleanUid) return toast.error("Failed to create project: Invalid UID");

        const initialMessage: ChatMessage = {
          mid: crypto.randomUUID(),
          role: 'user',
          text: e.prompt,
          timestamp: e.timestamp,
        };

        try {
            const entryWithCleanId = { ...e, uid: cleanUid };
            await dbFacade.atomicCreateProjectWithHistory(entryWithCleanId, initialMessage);
            const allProjects = await dbFacade.getAllProjects();
            setEntries(allProjects);
            setSelectedProject(entryWithCleanId);
        } catch (err: any) {
            toast.error("Project creation failed in database.");
        }
    };

    const updateEntry = async (updatedEntry: JournalEntry) => { 
        const cleanUid = dbFacade.projects.cleanId(updatedEntry.uid) || dbFacade.projects.cleanId(selectedProject?.uid);
        if (!cleanUid) return toast.error("Save failed: Project identity lost.");

        const finalEntry: JournalEntry = { ...updatedEntry, uid: cleanUid };
        try {
            await dbFacade.saveProject(finalEntry); 
            if (selectedProject?.uid === cleanUid) setSelectedProject(finalEntry); 
            setEntries(prev => {
                const idx = prev.findIndex(x => x.uid === cleanUid);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = finalEntry;
                return next;
            });
        } catch (err: any) {
            toast.error("Failed to save changes.");
        }
    };

    const deleteEntry = async (uid: string) => { 
        const cleanUid = dbFacade.projects.cleanId(uid);
        if (!cleanUid) return;
        await dbFacade.deleteProject(cleanUid); 
        setEntries(p => p.filter(x => x.uid !== cleanUid)); 
        if (selectedProject?.uid === cleanUid) setSelectedProject(null); 
        toast.success("Deleted"); 
    };

    return { 
        entries, selectedProject, openProject, setSelectedProject, loading, 
        settings, saveSettings, resetEverything, clearProjects, 
        createEntry, updateEntry, deleteEntry 
    };
};
