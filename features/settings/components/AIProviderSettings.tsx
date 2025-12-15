
import React, { useState, useMemo } from 'react';
import { AIProvider, AppSettings } from '../../../types';
import { toast } from '../../../services/toastService';
import { t } from '../../../services/i18n';

interface Props { settings: AppSettings; onChange: (k: keyof AppSettings, v: any) => void; }

export const AIProviderSettings: React.FC<Props> = ({ settings, onChange }) => {
    const [editing, setEditing] = useState<Partial<AIProvider> | null>(null);

    const save = () => {
        if (!editing?.name || !editing?.baseUrl) return toast.error(t('errorRequiredFields', 'settings'));
        const list = [...settings.customProviders];
        const idx = list.findIndex(p => p.id === editing.id);
        
        // Simple heuristic for models if empty
        const models = editing.models && editing.models.length > 0 ? editing.models : [{id: 'default', name: t('defaultModel', 'settings')}];
        const providerToSave = { ...editing, models } as AIProvider;

        if (idx >= 0) list[idx] = providerToSave;
        else list.push(providerToSave);
        
        onChange('customProviders', list);
        setEditing(null);
    };

    const remove = (id: string) => {
        const list = settings.customProviders.filter(p => p.id !== id);
        onChange('customProviders', list);
        // If active provider was deleted, reset to Gemini
        if (settings.activeProviderId === id) {
            onChange('activeProviderId', 'gemini');
            onChange('activeModelId', 'flash');
        }
    };

    const activeModels = useMemo(() => {
        const providerId = settings.activeProviderId || 'gemini';
        if (providerId === 'gemini') {
            return [{ id: 'flash', name: 'Gemini Flash' }, { id: 'pro', name: 'Gemini Pro' }];
        }
        return settings.customProviders.find(p => p.id === providerId)?.models || [];
    }, [settings.activeProviderId, settings.customProviders]);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange('activeProviderId', e.target.value);
        // Reset model when provider changes
        onChange('activeModelId', '');
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
                <span className="text-indigo-600">⚡</span> {t('aiProvidersTitle', 'settings')}
            </h3>
            
            <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-xs font-bold uppercase text-slate-500">{t('activeProvider', 'settings')}</label>
                         <select className="shadcn-input" value={settings.activeProviderId || 'gemini'} onChange={handleProviderChange}>
                             <option value="gemini">Google Gemini</option>
                             {settings.customProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="text-xs font-bold uppercase text-slate-500">{t('activeModel', 'settings')}</label>
                         <select className="shadcn-input" value={settings.activeModelId || ''} onChange={(e) => onChange('activeModelId', e.target.value)}>
                             {activeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                     </div>
                 </div>
            </div>
            
            {editing ? (
                <div className="p-4 border rounded-xl bg-slate-50 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">{t('name', 'common')}</label>
                            <input className="shadcn-input" placeholder="e.g. Ollama Local" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-500">{t('baseUrl', 'settings')}</label>
                            <input className="shadcn-input" placeholder="http://localhost:11434/v1" value={editing.baseUrl} onChange={e => setEditing({...editing, baseUrl: e.target.value})} />
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold uppercase text-slate-500">{t('apiKeyConfigKey', 'settings')}</label>
                         <input className="shadcn-input" placeholder={t('apiKeyConfigKeyPlaceholder', 'settings')} value={editing.apiKeyConfigKey || ''} onChange={e => setEditing({...editing, apiKeyConfigKey: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setEditing(null)} className="shadcn-btn shadcn-btn-ghost">{t('cancel', 'common')}</button>
                        <button onClick={save} className="shadcn-btn shadcn-btn-primary">{t('saveProvider', 'settings')}</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {settings.customProviders.length === 0 && <div className="text-sm text-slate-400 italic text-center py-4">{t('noCustomProviders', 'settings')}</div>}
                    
                    {settings.customProviders.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-slate-700">{p.name}</span>
                                <span className="text-xs text-slate-400 font-mono">{p.baseUrl}</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setEditing(p)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button onClick={() => remove(p.id)} className="p-2 hover:bg-red-50 rounded text-slate-500 hover:text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setEditing({ id: crypto.randomUUID(), name: '', baseUrl: '', models: [] })} className="shadcn-btn w-full border-dashed border-2">
                        {t('addProvider', 'settings')}
                    </button>
                </div>
            )}
        </div>
    );
};
