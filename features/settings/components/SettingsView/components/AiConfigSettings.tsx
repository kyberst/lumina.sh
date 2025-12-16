
import React from 'react';
import { AppSettings } from '../../../../../types';
import { t } from '../../../../../services/i18n';

interface Props {
  settings: AppSettings;
  handleChange: (field: keyof AppSettings, value: any) => void;
  attentionOptions: { value: string, label: string, desc: string }[];
  budgetOptions: { value: string, label: string }[];
  currentAttention: string;
  currentDesc: string;
}

export const AiConfigSettings: React.FC<Props> = ({ settings, handleChange, attentionOptions, budgetOptions, currentAttention, currentDesc }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium">{t('aiConfig', 'settings')}</h3>
      <div className="p-6 border rounded-xl bg-card shadow grid grid-cols-1 gap-6">
          <div className="space-y-2">
              <label className="text-sm font-medium">{t('contextSize', 'settings')}</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  {attentionOptions.map(opt => (
                      <button key={opt.value} onClick={() => handleChange('contextSize', opt.value)} className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all ${currentAttention === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {opt.label}
                      </button>
                  ))}
              </div>
              <p className="text-[10px] text-slate-500 pt-1 min-h-[1.5em]">{currentDesc}</p>
          </div>
          <div className="space-y-2">
              <label className="text-sm font-medium">{t('thinkingBudget', 'settings')}</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                  {budgetOptions.map(opt => (
                      <button key={opt.value} onClick={() => handleChange('thinkingBudget', opt.value)} className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all ${settings.thinkingBudget === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {opt.label}
                      </button>
                  ))}
              </div>
          </div>
           <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="space-y-1">
                <label className="text-sm font-medium">{t('learningMode', 'settings')}</label>
                <p className="text-[10px] text-slate-500">{t('learningModeDesc', 'settings')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings.learningMode} onChange={e => handleChange('learningMode', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-medium">{t('archContextTitle', 'settings')}</label>
              <p className="text-[10px] text-slate-500">{t('archContextDesc', 'settings')}</p>
              <textarea
                  value={settings.systemContextOverride || ''}
                  onChange={e => handleChange('systemContextOverride', e.target.value)}
                  className="shadcn-input min-h-[120px] text-xs font-mono"
                  placeholder={t('archContextPlaceholder', 'settings')}
              />
          </div>
      </div>
    </section>
  );
};
