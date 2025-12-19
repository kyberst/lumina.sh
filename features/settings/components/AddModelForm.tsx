import React, { useState } from 'react';
import { AIProviderModel } from '../../../types';

interface Props {
  model?: Partial<AIProviderModel>;
  onSave: (model: AIProviderModel) => void;
  onCancel: () => void;
}

export const AddModelForm: React.FC<Props> = ({ model, onSave, onCancel }) => {
  const [state, setState] = useState<Partial<AIProviderModel>>(model || { id: '', name: '' });

  const isFormValid = state.id && state.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSave(state as AIProviderModel);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">Model ID</label>
        <input className="shadcn-input" value={state.id || ''} onChange={e => setState({ ...state, id: e.target.value })} required />
        <p className="text-xs text-slate-500 mt-1">This must match the model expected by the API.</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">Human-Friendly Name</label>
        <input className="shadcn-input" value={state.name || ''} onChange={e => setState({ ...state, name: e.target.value })} required />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">Description</label>
        <input className="shadcn-input" value={state.description || ''} onChange={e => setState({ ...state, description: e.target.value })} />
         <p className="text-xs text-slate-500 mt-1">Optional: Describe the model's capabilities.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Context Window</label>
          <input type="number" className="shadcn-input" placeholder="e.g., 4096" value={state.contextWindow || ''} onChange={e => setState({ ...state, contextWindow: Number(e.target.value) || undefined })} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Max Output Tokens</label>
          <input type="number" className="shadcn-input" placeholder="e.g., 8192" value={state.maxOutputTokens || ''} onChange={e => setState({ ...state, maxOutputTokens: Number(e.target.value) || undefined })} />
        </div>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">Cancel</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary" disabled={!isFormValid}>
          {model ? 'Save Model' : 'Add Model'}
        </button>
      </div>
    </form>
  );
};