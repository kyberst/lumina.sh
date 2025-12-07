
import React from 'react';
import { AppSettings } from '../../types';
import { t } from '../../services/i18n';
import { AIProviderSettings } from './components/AIProviderSettings';
import { MCPSettings } from './components/MCPSettings';

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
                <span>Total Recall (SurrealDB Embedded)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.memory.enabled} onChange={e => handleMemoryChange('enabled', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </h3>
            <p className="text-xs text-slate-500">
                Enables semantic search and graph-based memory using Embedded SurrealDB. 
                Data is stored locally in your browser (IndexedDB) for privacy.
                No external database configuration required.
            </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AIProviderSettings settings={settings} onChange={handleChange} />
            <MCPSettings settings={settings} onChange={handleChange} />
        </div>
        
        <div className="pt-8 border-t">
             <h3 className="text-sm font-medium text-red-500 mb-4">Danger Zone</h3>
             <button onClick={() => { if(confirm("Reset all settings?")) onSave({...settings, customProviders: [], mcpServers: []}); }} className="shadcn-btn border-red-200 text-red-600 hover:bg-red-50">
                Factory Reset Settings
             </button>
        </div>
      </div>
    </div>
  );
};
