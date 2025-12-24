
import React, { useState, useEffect } from 'react';
import { AppSettings, AIProvider, AIProviderModel } from '../../../types';
import { SettingsCard } from './SettingsCard';
import { AddProviderForm } from './AddProviderForm';
import { AddModelForm } from './AddModelForm';
import { dialogService } from '../../../services/dialogService';
import { toast } from '../../../services/toastService';
import { testAIConnection } from '../../../services/llmService';
import { t } from '../../../services/i18n';

interface Props { settings: AppSettings; onSave: (s: AppSettings) => void; }

export const LlmProviderManager: React.FC<Props> = ({ settings, onSave }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

  useEffect(() => {
    // Sync state with props to prevent stale data after updates
    if (selectedProvider?.id) {
      const freshProvider = (settings.customProviders || []).find(p => p.id === selectedProvider.id);
      if (freshProvider) {
        // Deep compare with stringify to avoid infinite loops
        if (JSON.stringify(freshProvider) !== JSON.stringify(selectedProvider)) {
          setSelectedProvider(freshProvider);
        }
      } else {
        // The provider was deleted, so deselect it
        setSelectedProvider(null);
      }
    }
  }, [settings.customProviders, selectedProvider]);

  const handleSaveProvider = (provider: AIProvider) => {
    const providers = [...(settings.customProviders || [])];
    const index = providers.findIndex(p => p.id === provider.id);
    if (index > -1) providers[index] = provider;
    else providers.push(provider);
    onSave({ ...settings, customProviders: providers });
  };

  const handleSaveModel = (providerId: string, model: AIProviderModel) => {
    const provider = (settings.customProviders || []).find(p => p.id === providerId);
    if (!provider) return;
    const models = [...(provider.models || [])];
    const index = models.findIndex(m => m.id === model.id);
    if (index > -1) models[index] = model;
    else models.push(model);
    handleSaveProvider({ ...provider, models });
  };
  
  const handleDeleteModel = (providerId: string, modelId: string) => {
      const provider = (settings.customProviders || []).find(p => p.id === providerId);
      if (!provider) return;
      const models = (provider.models || []).filter(m => m.id !== modelId);
      handleSaveProvider({ ...provider, models });
  };

  const openProviderForm = (provider?: AIProvider) => {
    dialogService.alert(
        t('providers.addProvider', 'settings'), 
        <AddProviderForm provider={provider} onSave={p => { handleSaveProvider(p); dialogService.close(); }} onCancel={() => dialogService.close()} />,
        { hideButtons: true }
    );
  };

  const openModelForm = (providerId: string, model?: AIProviderModel) => {
    dialogService.alert(
        t('providers.addModel', 'settings'), 
        <AddModelForm model={model} onSave={m => { handleSaveModel(providerId, m); dialogService.close(); }} onCancel={() => dialogService.close()} />,
        { hideButtons: true }
    );
  };

  const handleTestConnection = async (provider: AIProvider, modelId: string) => {
    const apiKey = provider.apiKeyConfigKey ? settings.globalEnvVars[provider.apiKeyConfigKey] : '';
    if (provider.apiKeyConfigKey && !apiKey) {
      toast.error(`API Key env var '${provider.apiKeyConfigKey}' not set.`);
      return;
    }
    const toastId = toast.loading(`Testing ${modelId}...`);
    try {
      await testAIConnection(provider, modelId, apiKey);
      toast.success('Connection successful!');
    } catch(e: any) {
      toast.error(`Test failed: ${e.message}`);
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <SettingsCard title={t('providers.title', 'settings')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 border-r border-slate-200 pr-4">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('providers.list', 'settings')}</h4>
                <div className="space-y-1">
                    {(settings.customProviders || []).map(p => (
                        <div key={p.id} onClick={() => setSelectedProvider(p)} className={`p-2 rounded-md cursor-pointer ${selectedProvider?.id === p.id ? 'bg-indigo-100' : 'hover:bg-slate-50'}`}>
                            <p className="font-semibold text-sm text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500 truncate">{p.baseUrl}</p>
                        </div>
                    ))}
                </div>
                <button onClick={() => openProviderForm()} className="shadcn-btn w-full border-dashed border-2 mt-2 text-sm h-9">
                    {t('providers.addProvider', 'settings')}
                </button>
            </div>

            <div className="md:col-span-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">{t('providers.models', 'settings')}</h4>
                {selectedProvider ? (
                    <div className="space-y-2">
                        {(selectedProvider.models || []).map(m => (
                            <div key={m.id} className="p-2 border border-slate-200 rounded-md bg-white flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{m.id}</p>
                                </div>
                                <div>
                                    <button onClick={() => openModelForm(selectedProvider.id, m)} className="text-xs shadcn-btn shadcn-btn-ghost h-7 px-2">{t('providers.edit', 'settings')}</button>
                                    <button onClick={() => handleTestConnection(selectedProvider, m.id)} className="text-xs shadcn-btn shadcn-btn-ghost h-7 px-2 text-emerald-600 hover:bg-emerald-50">{t('providers.test', 'settings')}</button>
                                    <button onClick={() => handleDeleteModel(selectedProvider.id, m.id)} className="text-xs shadcn-btn shadcn-btn-ghost h-7 px-2 text-red-500 hover:bg-red-50">{t('providers.delete', 'settings')}</button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => openModelForm(selectedProvider.id)} className="shadcn-btn w-full border-dashed border-2 text-sm h-9">
                            {t('providers.addModel', 'settings')}
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 text-sm">{t('providers.noModels', 'settings')}</div>
                )}
            </div>
        </div>
    </SettingsCard>
  );
};
