
import React from 'react';
import { AppSettings } from '../../types';
import { t } from '../../services/i18n';
import { AIProviderSettings } from './components/AIProviderSettings';

interface SettingsViewProps { settings: AppSettings; onSave: (s: AppSettings) => void; entries: any[]; }

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const handleChange = (field: keyof AppSettings, value: any) => onSave({ ...settings, [field]: value });
  
  const handleMemoryChange = (field: string, value: any) => {
      onSave({ ...settings, memory: { ...settings.memory, [field]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <header className="mb-8 border-b pb-4"><h2 className="text-2xl font-bold">{t('title', 'settings')}</h2></header>
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-medium">{t('general', 'settings')}</h3>
          <div className="p-6 border rounded-xl bg-card shadow grid grid-cols-2 gap-6">
             <div className="space-y-2">
                 <label className="text-sm font-medium">{t('language', 'settings')}</label>
                 <select className="shadcn-input" value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                    <option value="en">English</option><option value="es">Español</option>
                 </select>
             </div>
             <div className="space-y-2">
                 <label className="text-sm font-medium">{t('zoom', 'settings')}</label>
                 <input type="range" min="0.8" max="1.2" step="0.1" value={settings.zoomLevel} onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
             </div>
          </div>
        </section>

        <section className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
                <span>Infinite Memory (RAG)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.memory.enabled} onChange={e => handleMemoryChange('enabled', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </h3>
            {settings.memory.enabled && (
                <div className="p-6 border rounded-xl bg-card shadow space-y-6">
                    <div>
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Qdrant (Vector Database)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">URL</label>
                                <input className="shadcn-input" placeholder="http://localhost:6333" value={settings.memory.qdrantUrl} onChange={e => handleMemoryChange('qdrantUrl', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">API Key</label>
                                <input className="shadcn-input" type="password" placeholder="(Optional)" value={settings.memory.qdrantKey || ''} onChange={e => handleMemoryChange('qdrantKey', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Neo4j (Graph Database)</h4>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">HTTP Endpoint</label>
                                <input className="shadcn-input" placeholder="http://localhost:7474/db/neo4j/tx/commit" value={settings.memory.neo4jUrl} onChange={e => handleMemoryChange('neo4jUrl', e.target.value)} />
                                <p className="text-[10px] text-slate-500">Must be the HTTP Transaction endpoint, not the Bolt URL.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Username</label>
                                    <input className="shadcn-input" value={settings.memory.neo4jUser || ''} onChange={e => handleMemoryChange('neo4jUser', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Password</label>
                                    <input className="shadcn-input" type="password" value={settings.memory.neo4jPass || ''} onChange={e => handleMemoryChange('neo4jPass', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>

        <AIProviderSettings settings={settings} onChange={handleChange} />
      </div>
    </div>
  );
};