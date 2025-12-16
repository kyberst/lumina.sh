
import React from 'react';
import { AppSettings } from '../../../../../types';
import { t } from '../../../../../services/i18n';

interface Props {
  settings: AppSettings;
  modelToAdd: string;
  setModelToAdd: (v: string) => void;
  allAvailableModels: { id: string; name: string; providerName?: string }[];
  handleAddModel: () => void;
  handleRemoveModel: (id: string) => void;
}

export const FailoverSettings: React.FC<Props> = ({ modelToAdd, setModelToAdd, allAvailableModels, handleAddModel, handleRemoveModel, settings }) => {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium">{t('failoverTitle', 'settings')}</h3>
       <div className="p-6 border rounded-xl bg-card shadow space-y-4">
          <p className="text-xs text-slate-500">{t('failoverDesc', 'settings')}</p>
          <div className="flex gap-2">
              <select value={modelToAdd} onChange={e => setModelToAdd(e.target.value)} className="shadcn-input">
                  <option value="">{t('selectModel', 'settings')}</option>
                  {allAvailableModels.map(m => <option key={m.id} value={m.id} disabled={(settings.modelPriority || []).includes(m.id)}>{m.name} {m.providerName ? `(${m.providerName})` : ''}</option>)}
              </select>
              <button onClick={handleAddModel} className="shadcn-btn shadcn-btn-primary">{t('add', 'settings')}</button>
          </div>
          <div className="space-y-2 pt-2">
              {(settings.modelPriority || []).map((modelId, i) => (
                  <div key={modelId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 w-6 text-center">{i + 1}.</span>
                          <span className="text-sm font-semibold text-slate-700">{allAvailableModels.find(m => m.id === modelId)?.name || modelId}</span>
                      </div>
                      <button onClick={() => handleRemoveModel(modelId)} className="text-red-500 hover:text-red-700 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                  </div>
              ))}
          </div>
       </div>
    </section>
  );
};
