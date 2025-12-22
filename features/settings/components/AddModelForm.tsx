
import React, { useState } from 'react';
import { AIProviderModel } from '../../../types';
import { t } from '../../../services/i18n';

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
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.modelId', 'settings')}</label>
        <input className="shadcn-input" value={state.id || ''} onChange={e => setState({ ...state, id: e.target.value })} required />
        <p className="text-xs text-slate-500 mt-1">{t('form.modelIdDesc', 'settings')}</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.displayName', 'settings')}</label>
        <input className="shadcn-input" value={state.name || ''} onChange={e => setState({ ...state, name: e.target.value })} required />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.description', 'settings')}</label>
        <input className="shadcn-input" value={state.description || ''} onChange={e => setState({ ...state, description: e.target.value })} />
         <p className="text-xs text-slate-500 mt-1">{t('form.descriptionDesc', 'settings')}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">{t('form.contextWindow', 'settings')}</label>
          <input type="number" className="shadcn-input" placeholder="e.g., 4096" value={state.contextWindow || ''} onChange={e => setState({ ...state, contextWindow: Number(e.target.value) || undefined })} />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">{t('form.maxTokens', 'settings')}</label>
          <input type="number" className="shadcn-input" placeholder="e.g., 8192" value={state.maxOutputTokens || ''} onChange={e => setState({ ...state, maxOutputTokens: Number(e.target.value) || undefined })} />
        </div>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">{t('form.cancel', 'settings')}</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary" disabled={!isFormValid}>
          {model ? t('form.save', 'settings') : t('form.add', 'settings')}
        </button>
      </div>
    </form>
  );
};
