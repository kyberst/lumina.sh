
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
      const newErrors: Record<string, string> = {};
      
      if (!state.id?.trim()) newErrors.id = "Model ID is required";
      if (!state.name?.trim()) newErrors.name = "Display Name is required";
      
      if (state.contextWindow !== undefined && state.contextWindow <= 0) newErrors.contextWindow = "Must be > 0";
      if (state.maxOutputTokens !== undefined && state.maxOutputTokens <= 0) newErrors.maxOutputTokens = "Must be > 0";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(state as AIProviderModel);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.modelId', 'settings')}</label>
        <input 
            className={`shadcn-input ${errors.id ? 'border-red-500 focus:ring-red-200' : ''}`}
            value={state.id || ''} 
            onChange={e => setState({ ...state, id: e.target.value })} 
        />
        {errors.id ? <p className="text-xs text-red-500 mt-1">{errors.id}</p> : <p className="text-xs text-slate-500 mt-1">{t('form.modelIdDesc', 'settings')}</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.displayName', 'settings')}</label>
        <input 
            className={`shadcn-input ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
            value={state.name || ''} 
            onChange={e => setState({ ...state, name: e.target.value })} 
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-slate-500">{t('form.description', 'settings')}</label>
        <input className="shadcn-input" value={state.description || ''} onChange={e => setState({ ...state, description: e.target.value })} />
         <p className="text-xs text-slate-500 mt-1">{t('form.descriptionDesc', 'settings')}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">{t('form.contextWindow', 'settings')}</label>
          <input 
            type="number" 
            className={`shadcn-input ${errors.contextWindow ? 'border-red-500 focus:ring-red-200' : ''}`}
            placeholder="e.g., 4096" 
            value={state.contextWindow || ''} 
            onChange={e => setState({ ...state, contextWindow: Number(e.target.value) || undefined })} 
          />
          {errors.contextWindow && <p className="text-xs text-red-500 mt-1">{errors.contextWindow}</p>}
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">{t('form.maxTokens', 'settings')}</label>
          <input 
            type="number" 
            className={`shadcn-input ${errors.maxOutputTokens ? 'border-red-500 focus:ring-red-200' : ''}`}
            placeholder="e.g., 8192" 
            value={state.maxOutputTokens || ''} 
            onChange={e => setState({ ...state, maxOutputTokens: Number(e.target.value) || undefined })} 
          />
          {errors.maxOutputTokens && <p className="text-xs text-red-500 mt-1">{errors.maxOutputTokens}</p>}
        </div>
      </div>
      <div className="flex justify-end pt-4 gap-2">
        <button type="button" onClick={onCancel} className="shadcn-btn shadcn-btn-outline">{t('form.cancel', 'settings')}</button>
        <button type="submit" className="shadcn-btn shadcn-btn-primary">
          {model ? t('form.save', 'settings') : t('form.add', 'settings')}
        </button>
      </div>
    </form>
  );
};
