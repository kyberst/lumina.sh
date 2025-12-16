
import React from 'react';
import { AppSettings } from '../../../../../types';
import { t } from '../../../../../services/i18n';

interface Props {
  settings: AppSettings;
  handleMemoryChange: (field: string, value: any) => void;
}

export const MemorySettings: React.FC<Props> = ({ settings, handleMemoryChange }) => {
  return (
    <section className="space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
            <span>{t('memoryTitle', 'settings')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.memory.enabled} onChange={e => handleMemoryChange('enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </h3>
        <p className="text-xs text-slate-500">
            {t('memoryDesc', 'settings')}
        </p>
    </section>
  );
};
