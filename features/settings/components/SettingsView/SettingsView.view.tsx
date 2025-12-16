
import React from 'react';
import { AppSettings } from '../../../../types';
import { t } from '../../../../services/i18n';
import { AIProviderSettings } from '../../components/AIProviderSettings';
import { MCPSettings } from '../../components/MCPSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { AiConfigSettings } from './components/AiConfigSettings';
import { FailoverSettings } from './components/FailoverSettings';
import { AutomationSettings } from './components/AutomationSettings';
import { MemorySettings } from './components/MemorySettings';
import { DangerZone } from './components/DangerZone';

interface SettingsViewProps {
  settings: AppSettings;
  modelToAdd: string;
  setModelToAdd: (v: string) => void;
  allAvailableModels: { id: string; name: string; providerName?: string }[];
  attentionOptions: { value: string; label: string; desc: string }[];
  budgetOptions: { value: string; label: string }[];
  currentAttention: string;
  currentDesc: string;
  handleChange: (field: keyof AppSettings, value: any) => void;
  handleMemoryChange: (field: string, value: any) => void;
  handleAddModelToPriority: () => void;
  handleRemoveModelFromPriority: (id: string) => void;
  handleFactoryReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const { settings, handleChange, handleMemoryChange, handleFactoryReset } = props;

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <header className="mb-8 border-b pb-4"><h2 className="text-2xl font-bold">{t('title', 'settings')}</h2></header>
      <div className="space-y-8">
        <GeneralSettings settings={settings} handleChange={handleChange} />
        
        {settings.developerMode && (
          <>
            <AiConfigSettings
              settings={settings}
              handleChange={handleChange}
              attentionOptions={props.attentionOptions}
              budgetOptions={props.budgetOptions}
              currentAttention={props.currentAttention}
              currentDesc={props.currentDesc}
            />
            <FailoverSettings
              settings={settings}
              modelToAdd={props.modelToAdd}
              setModelToAdd={props.setModelToAdd}
              allAvailableModels={props.allAvailableModels}
              handleAddModel={props.handleAddModelToPriority}
              handleRemoveModel={props.handleRemoveModelFromPriority}
            />
          </>
        )}

        <AutomationSettings settings={settings} handleChange={handleChange} />
        <MemorySettings settings={settings} handleMemoryChange={handleMemoryChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AIProviderSettings settings={settings} onChange={handleChange} />
            <MCPSettings settings={settings} onChange={handleChange} />
        </div>
        
        <DangerZone onFactoryReset={handleFactoryReset} />
      </div>
    </div>
  );
};
