
import React from 'react';
import { AppSettings } from '../../../../../types';
import { t } from '../../../../../services/i18n';

interface Props {
  settings: AppSettings;
  handleChange: (field: keyof AppSettings, value: any) => void;
}

export const GeneralSettings: React.FC<Props> = ({ settings, handleChange }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium">{t('general', 'settings')}</h3>
      <div className="p-6 border rounded-xl bg-card shadow grid grid-cols-2 gap-6">
         <div className="space-y-2">
             <label className="text-sm font-medium">{t('language', 'settings')}</label>
             <select className="shadcn-input" value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                <option value="en">{t('english', 'nav')}</option><option value="es">{t('spanish', 'nav')}</option>
             </select>
         </div>
         <div className="space-y-2">
             <label className="text-sm font-medium">{t('zoom', 'settings')}</label>
             <input type="range" min="0.8" max="1.2" step="0.1" value={settings.zoomLevel} onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
         </div>
         <div className="col-span-2 flex items-center justify-between pt-2">
            <div className="space-y-1">
                <label className="text-sm font-medium">{t('devMode', 'settings')}</label>
                <p className="text-[10px] text-slate-500">{t('devModeDesc', 'settings')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.developerMode} onChange={e => handleChange('developerMode', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
      </div>
    </section>
  );
};
