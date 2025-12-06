
import React from 'react';
import { AppSettings } from '../../types';
import { t } from '../../services/i18n';
import { AIProviderSettings } from './components/AIProviderSettings';

interface SettingsViewProps { settings: AppSettings; onSave: (s: AppSettings) => void; entries: any[]; }

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const handleChange = (field: keyof AppSettings, value: any) => onSave({ ...settings, [field]: value });

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
        <AIProviderSettings settings={settings} onChange={handleChange} />
      </div>
    </div>
  );
};
