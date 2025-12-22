
import React, { useState } from 'react';
import { AIProvider } from '../../../types';
import { t } from '../../../services/i18n';

interface Props {
  provider?: Partial<AIProvider>;
  onSave: (provider: AIProvider) => void;
  onCancel: () => void;
}

export const AddProviderForm: React.FC<Props> = ({ provider, onSave, onCancel }) => {
  const [state, setState] = useState<Partial<AIProvider>>(provider || { models: [] });

  const isFormValid = state.id && state.name && state.baseUrl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSave({ id: state.id!, name: state.name!, baseUrl: state.baseUrl!, apiKeyConfigKey: state.apiKeyConfigKey || '', models: state.models || [] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.providerId', 'settings')}</label>
        <input className="shadcn-input" placeholder="e.g., my-provider" value={state.id || ''} onChange={e => setState({ ...state, id: e.target.value.replace(/\s+/g, '-') })} required disabled={!!provider} />
        <p className="text-xs text-slate-500 mt-1">{t('form.providerIdDesc', 'settings')}</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.displayName', 'settings')}</label>
        <input className="shadcn-input" placeholder="e.g., My Provider" value={state.name || ''} onChange={e => setState({ ...state, name: e.target.value })} required />
         <p className="text-xs text-slate-500 mt-1">{t('form.displayNameDesc', 'settings')}</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.baseUrl', 'settings')}</label>
        <input className="shadcn-input" placeholder="e.g., https://api.example.com/v1" value={state.baseUrl || ''} onChange={e => setState({ ...state, baseUrl: e.target.value })} required />
        <p className="text-xs text-slate-500 mt-1">{t('form.baseUrlDesc', 'settings')}</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.apiKeyVar', 'settings')}</label>
        <input className="shadcn-input" placeholder="e.g., MY_PROVIDER_API_KEY" value={state.apiKeyConfigKey || ''} onChange={e => setState({ ...state, apiKeyConfigKey: e.target.value })} />
        <p className="text-xs text-slate-500 mt-1">{t('form.apiKeyVarDesc', 'settings')}</p>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">{t('form.cancel', 'settings')}</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary" disabled={!isFormValid}>
          {provider ? t('form.save', 'settings') : t('form.add', 'settings')}
        </button>
      </div>
    </form>
  );
};
