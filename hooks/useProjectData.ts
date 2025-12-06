
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
    const [settings, setSettings] = useState<AppSettings>({ language: getLanguage(), aiModel: 'flash', theme: 'dark', zoomLevel: 1, thinkingBudget: 'medium', contextSize: 'default', autoApprove: false, autoFix: false, mcpServers: [], customProviders: [], telemetryId: '' });

    useEffect(() => {
        (async () => {
            try {
                await sqliteService.init();
                setEntries(await sqliteService.getAllProjects());
                setUser(await authService.getCurrentUser());
            } catch(e) { console.error(e); } finally { setLoading(false); }
        })();
    }, []);

    const saveSettings = (s: AppSettings) => { setSettings(s); if(s.language !== settings.language) setLanguage(s.language); };
    const createEntry = async (e: JournalEntry) => { await sqliteService.saveProject(e); setEntries(await sqliteService.getAllProjects()); setSelectedProject(e); };
    const updateEntry = async (e: JournalEntry) => { await sqliteService.saveProject(e); setEntries(p => p.map(x => x.id===e.id?e:x)); if(selectedProject?.id===e.id) setSelectedProject(e); };
    const deleteEntry = async (id: string) => { await sqliteService.deleteProject(id); setEntries(p => p.filter(x => x.id!==id)); if(selectedProject?.id===id) setSelectedProject(null); toast.success("Deleted"); };

    return { user, setUser, entries, selectedProject, setSelectedProject, loading, settings, saveSettings, createEntry, updateEntry, deleteEntry };
};
