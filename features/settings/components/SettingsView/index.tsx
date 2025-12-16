
import React from 'react';
import { AppSettings } from '../../../../types';
import { useSettingsView } from './useSettingsView.hook';
import { SettingsView as SettingsViewComponent } from './SettingsView.view';

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  entries: any[];
}

export const SettingsView: React.FC<Props> = ({ settings, onSave }) => {
  const hook = useSettingsView({ settings, onSave });

  return (
    <SettingsViewComponent
      settings={settings}
      modelToAdd={hook.modelToAdd}
      setModelToAdd={hook.setModelToAdd}
      allAvailableModels={hook.allAvailableModels}
      attentionOptions={hook.attentionOptions}
      budgetOptions={hook.budgetOptions}
      currentAttention={hook.currentAttention}
      currentDesc={hook.currentDesc}
      handleChange={hook.handleChange}
      handleMemoryChange={hook.handleMemoryChange}
      handleAddModelToPriority={hook.handleAddModelToPriority}
      handleRemoveModelFromPriority={hook.handleRemoveModelFromPriority}
      handleFactoryReset={hook.handleFactoryReset}
    />
  );
};
