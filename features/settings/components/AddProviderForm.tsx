import React, { useState } from 'react';
import { AIProvider } from '../../../types';

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
        <label className="text-xs font-bold uppercase text-slate-500">Provider ID</label>
        <input className="shadcn-input" placeholder="e.g., my-provider" value={state.id || ''} onChange={e => setState({ ...state, id: e.target.value.replace(/\s+/g, '-') })} required disabled={!!provider} />
        <p className="text-xs text-slate-500 mt-1">A unique identifier for this provider (no spaces).</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">Display Name</label>
        <input className="shadcn-input" placeholder="e.g., My Provider" value={state.name || ''} onChange={e => setState({ ...state, name: e.target.value })} required />
         <p className="text-xs text-slate-500 mt-1">The name that will be displayed in the UI.</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">Base URL</label>
        <input className="shadcn-input" placeholder="e.g., https://api.example.com/v1" value={state.baseUrl || ''} onChange={e => setState({ ...state, baseUrl: e.target.value })} required />
        <p className="text-xs text-slate-500 mt-1">The base URL for the API endpoint.</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">API Key Env Var</label>
        <input className="shadcn-input" placeholder="e.g., MY_PROVIDER_API_KEY" value={state.apiKeyConfigKey || ''} onChange={e => setState({ ...state, apiKeyConfigKey: e.target.value })} />
        <p className="text-xs text-slate-500 mt-1">Environment variable name for the API key.</p>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">Cancel</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary" disabled={!isFormValid}>
          {provider ? 'Save Provider' : 'Add Provider'}
        </button>
      </div>
    </form>
  );
};