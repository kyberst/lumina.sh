
import React from 'react';
import { AppSettings } from '../../../../../types';
import { t } from '../../../../../services/i18n';

interface Props {
  settings: AppSettings;
  handleChange: (field: keyof AppSettings, value: any) => void;
}

export const AutomationSettings: React.FC<Props> = ({ settings, handleChange }) => {
  return (
    <section className="space-y-4">
        <h3 className="text-sm font-medium">{t('automation', 'settings')}</h3>
        <div className="p-6 border rounded-xl bg-card shadow space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium">{t('autoApprove', 'settings')}</label>
                    <p className="text-[10px] text-slate-500">{t('autoApproveDesc', 'settings')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.autoApprove} onChange={e => handleChange('autoApprove', e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div></label>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <label className="text-sm font-medium">{t('autoFix', 'settings')}</label>
                    <p className="text-[10px] text-slate-500">{t('autoFixDesc', 'settings')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.autoFix} onChange={e => handleChange('autoFix', e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div></label>
            </div>
        </div>
    </section>
  );
};
