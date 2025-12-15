
import React, { useMemo, useState } from 'react';
import { AppSettings } from '../../types';
import { t } from '../../services/i18n';
import { AIProviderSettings } from './components/AIProviderSettings';
import { MCPSettings } from './components/MCPSettings';

interface SettingsViewProps { settings: AppSettings; onSave: (s: AppSettings) => void; entries: any[]; }

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const handleChange = (field: keyof AppSettings, value: any) => onSave({ ...settings, [field]: value });
  
  const handleMemoryChange = (field: string, value: any) => {
      onSave({ ...settings, memory: { ...settings.memory, [field]: value } });
  };
  
  const [modelToAdd, setModelToAdd] = useState('');

  const allAvailableModels = useMemo(() => {
      const geminiModels = [ { id: 'flash', name: 'Gemini Flash' }, { id: 'pro', name: 'Gemini Pro' } ];
      const custom = settings.customProviders.flatMap(p => p.models.map(m => ({...m, providerName: p.name}))) || [];
      return [...geminiModels, ...custom];
  }, [settings.customProviders]);
  
  const handleAddModelToPriority = () => {
    if (modelToAdd && !(settings.modelPriority || []).includes(modelToAdd)) {
        onSave({ ...settings, modelPriority: [...(settings.modelPriority || []), modelToAdd] });
    }
  };
  
  const handleRemoveModelFromPriority = (modelId: string) => {
      onSave({ ...settings, modelPriority: (settings.modelPriority || []).filter(m => m !== modelId) });
  };

  const attentionOptions = [
    { value: 'economy', label: t('attentionFast', 'settings'), desc: t('attentionFastDesc', 'settings') },
    { value: 'default', label: t('attentionNormal', 'settings'), desc: t('attentionNormalDesc', 'settings') },
    { value: 'max', label: t('attentionDeep', 'settings'), desc: t('attentionDeepDesc', 'settings') }
  ];

  const budgetOptions = [ { value: 'low', label: t('budgetLow', 'settings') }, { value: 'medium', label: t('budgetMedium', 'settings') }, { value: 'high', label: t('budgetHigh', 'settings') } ];

  // Map legacy/intermediate values to the 3 main options for UI selection
  const currentAttention = ['plus', 'high', 'max'].includes(settings.contextSize) ? 'max' : settings.contextSize;
  const currentDesc = attentionOptions.find(o => o.value === currentAttention)?.desc || attentionOptions[1].desc;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <header className="mb-8 border-b pb-4"><h2 className="text-2xl font-bold">{t('title', 'settings')}</h2></header>
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-medium">{t('general', 'settings')}</h3>
          <div className="p-6 border rounded-xl bg-card shadow grid grid-cols-2 gap-6">
             <div className="space-y-2">
                 <label className="text-sm font-medium">{t('language', 'settings')}</label>
                 <select className="shadcn-input" value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                    <option value="en">{t('english', 'nav')}</option><option value="es">{t('spanish', 'nav')}</option>
                 </select>
             </div>
             <div className="space-y-2">
                 <label className="text-sm font-medium">{t('zoom', 'settings')}</label>
                 <input type="range" min="0.8" max="1.2" step="0.1" value={settings.zoomLevel} onChange={e => handleChange('zoomLevel', parseFloat(e.target.value))} className="w-full accent-indigo-600" />
             </div>
             <div className="col-span-2 flex items-center justify-between pt-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium">{t('devMode', 'settings')}</label>
                    <p className="text-[10px] text-slate-500">{t('devModeDesc', 'settings')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.developerMode} onChange={e => handleChange('developerMode', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
          </div>
        </section>
        
        {settings.developerMode && (
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
                          placeholder="e.g. Always use Redux for global state. Use styled-components for styling."
                      />
                  </div>
              </div>
          </section>
        )}
        
        {settings.developerMode && (
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t('failoverTitle', 'settings')}</h3>
             <div className="p-6 border rounded-xl bg-card shadow space-y-4">
                <p className="text-xs text-slate-500">{t('failoverDesc', 'settings')}</p>
                <div className="flex gap-2">
                    <select value={modelToAdd} onChange={e => setModelToAdd(e.target.value)} className="shadcn-input">
                        <option value="">{t('selectModel', 'settings')}</option>
                        {// FIX: Cast model object 'm' to 'any' to resolve TypeScript error when accessing 'providerName'. The 'allAvailableModels' array contains objects of a union type, and this property is not present on all of them.
                        allAvailableModels.map(m => <option key={m.id} value={m.id} disabled={(settings.modelPriority || []).includes(m.id)}>{m.name} {(m as any).providerName ? `(${(m as any).providerName})` : ''}</option>)}
                    </select>
                    <button onClick={handleAddModelToPriority} className="shadcn-btn shadcn-btn-primary">{t('add', 'settings')}</button>
                </div>
                <div className="space-y-2 pt-2">
                    {(settings.modelPriority || []).map((modelId, i) => (
                        <div key={modelId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-6 text-center">{i + 1}.</span>
                                <span className="text-sm font-semibold text-slate-700">{allAvailableModels.find(m => m.id === modelId)?.name || modelId}</span>
                            </div>
                            <button onClick={() => handleRemoveModelFromPriority(modelId)} className="text-red-500 hover:text-red-700 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
             </div>
          </section>
        )}

        <section className="space-y-4">
            <h3 className="text-sm font-medium">{t('automation', 'settings')}</h3>
            <div className="p-6 border rounded-xl bg-card shadow space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium">{t('autoApprove', 'settings')}</label>
                        <p className="text-[10px] text-slate-500">{t('autoApproveDesc', 'settings')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.autoApprove} onChange={e => handleChange('autoApprove', e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div></label>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium">{t('autoFix', 'settings')}</label>
                        <p className="text-[10px] text-slate-500">{t('autoFixDesc', 'settings')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={settings.autoFix} onChange={e => handleChange('autoFix', e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div></label>
                </div>
            </div>
        </section>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AIProviderSettings settings={settings} onChange={handleChange} />
            <MCPSettings settings={settings} onChange={handleChange} />
        </div>
        
        <div className="pt-8 border-t">
             <h3 className="text-sm font-medium text-red-500 mb-4">{t('dangerZone', 'settings')}</h3>
             <button onClick={() => { if(confirm(t('resetConfirm', 'settings'))) onSave({...settings, customProviders: [], mcpServers: []}); }} className="shadcn-btn border-red-200 text-red-600 hover:bg-red-50">
                {t('factoryReset', 'settings')}
             </button>
        </div>
      </div>
    </div>
  );
};