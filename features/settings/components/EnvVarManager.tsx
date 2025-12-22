
import React, { useState } from 'react';
import { SettingsCard } from './SettingsCard';
import { t } from '../../../services/i18n';

interface Props {
  globalEnvVars: Record<string, string>;
  onSave: (vars: Record<string, string>) => void;
}

export const EnvVarManager: React.FC<Props> = ({ globalEnvVars, onSave }) => {
  const [vars, setVars] = useState(globalEnvVars);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey && !vars[newKey]) {
      const newVars = { ...vars, [newKey]: newValue };
      setVars(newVars);
      onSave(newVars);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleUpdate = (key: string, value: string) => {
    const newVars = { ...vars, [key]: value };
    setVars(newVars);
    onSave(newVars);
  };
  
  const handleDelete = (key: string) => {
    const { [key]: _, ...rest } = vars;
    setVars(rest);
    onSave(rest);
  };

  return (
    <SettingsCard title={t('env.title', 'settings')}>
      <div className="space-y-2">
        {Object.keys(vars).length === 0 && <p className="text-sm text-slate-400 text-center py-4">{t('env.noVars', 'settings')}</p>}
        {Object.entries(vars).map(([key, value]) => (
          <div key={key} className="flex gap-2 items-center">
            <input value={key} disabled className="shadcn-input font-mono text-sm bg-slate-100 border-slate-200" />
            <input value={value} type="password" onChange={e => handleUpdate(key, e.target.value)} className="shadcn-input font-mono text-sm" />
            <button onClick={() => handleDelete(key)} className="shadcn-btn shadcn-btn-ghost text-red-500 h-9 w-9 p-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
        <div className="flex gap-2 items-center pt-2 border-t border-slate-200 mt-4">
            <input placeholder={t('env.placeholderKey', 'settings')} value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} className="shadcn-input font-mono text-sm" />
            <input placeholder={t('env.placeholderValue', 'settings')} value={newValue} onChange={e => setNewValue(e.target.value)} className="shadcn-input font-mono text-sm" />
            <button onClick={handleAdd} className="shadcn-btn shadcn-btn-primary h-9 px-3 text-sm">{t('env.add', 'settings')}</button>
        </div>
      </div>
    </SettingsCard>
  );
};
