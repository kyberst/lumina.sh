
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      
      // ID: lowercase alphanumeric + dash, no spaces
      if (!state.id) newErrors.id = "ID is required";
      else if (!/^[a-z0-9-]+$/.test(state.id)) newErrors.id = "Only lowercase alphanumeric and hyphens allowed (no spaces).";

      // URL: Must resemble a URL
      if (!state.baseUrl) newErrors.baseUrl = "Base URL is required";
      else if (!/^https?:\/\//.test(state.baseUrl)) newErrors.baseUrl = "Must start with http:// or https://";

      // Name: Required
      if (!state.name) newErrors.name = "Display Name is required";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && state.id && state.name && state.baseUrl) {
      onSave({ id: state.id, name: state.name, baseUrl: state.baseUrl, apiKeyConfigKey: state.apiKeyConfigKey || '', models: state.models || [] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.providerId', 'settings')}</label>
        <input 
            className={`shadcn-input ${errors.id ? 'border-red-500 focus:ring-red-200' : ''}`} 
            placeholder="e.g., my-provider" 
            value={state.id || ''} 
            onChange={e => setState({ ...state, id: e.target.value })} 
            disabled={!!provider} 
        />
        {errors.id ? <p className="text-xs text-red-500 mt-1">{errors.id}</p> : <p className="text-xs text-slate-500 mt-1">{t('form.providerIdDesc', 'settings')}</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.displayName', 'settings')}</label>
        <input 
            className={`shadcn-input ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`} 
            placeholder="e.g., My Provider" 
            value={state.name || ''} 
            onChange={e => setState({ ...state, name: e.target.value })} 
        />
         {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name}</p> : <p className="text-xs text-slate-500 mt-1">{t('form.displayNameDesc', 'settings')}</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.baseUrl', 'settings')}</label>
        <input 
            className={`shadcn-input ${errors.baseUrl ? 'border-red-500 focus:ring-red-200' : ''}`} 
            placeholder="e.g., https://api.example.com/v1" 
            value={state.baseUrl || ''} 
            onChange={e => setState({ ...state, baseUrl: e.target.value })} 
        />
        {errors.baseUrl ? <p className="text-xs text-red-500 mt-1">{errors.baseUrl}</p> : <p className="text-xs text-slate-500 mt-1">{t('form.baseUrlDesc', 'settings')}</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.apiKeyVar', 'settings')}</label>
        <input className="shadcn-input" placeholder="e.g., MY_PROVIDER_API_KEY" value={state.apiKeyConfigKey || ''} onChange={e => setState({ ...state, apiKeyConfigKey: e.target.value })} />
        <p className="text-xs text-slate-500 mt-1">{t('form.apiKeyVarDesc', 'settings')}</p>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">{t('form.cancel', 'settings')}</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary">
          {provider ? t('form.save', 'settings') : t('form.add', 'settings')}
        </button>
      </div>
    </form>
  );
};
