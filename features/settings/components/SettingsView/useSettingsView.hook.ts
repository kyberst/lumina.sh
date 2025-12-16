
import { useMemo, useState } from 'react';
import { AppSettings } from '../../../../types';
import { t } from '../../../../services/i18n';
import { dialogService } from '../../../../services/dialogService';

interface Props {
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
}

export const useSettingsView = ({ settings, onSave }: Props) => {
    const [modelToAdd, setModelToAdd] = useState('');

    const handleChange = (field: keyof AppSettings, value: any) => onSave({ ...settings, [field]: value });
  
    const handleMemoryChange = (field: string, value: any) => {
        onSave({ ...settings, memory: { ...settings.memory, [field]: value } });
    };

    const allAvailableModels = useMemo(() => {
        const geminiModels = [ { id: 'flash', name: t('geminiFlashName', 'settings') }, { id: 'pro', name: t('geminiProName', 'settings') } ];
        const custom = (settings.customProviders || []).flatMap(p => p.models.map(m => ({...m, providerName: p.name}))) || [];
        return [...geminiModels, ...custom];
    }, [settings.customProviders, settings.language]);

    const handleAddModelToPriority = () => {
        if (modelToAdd && !(settings.modelPriority || []).includes(modelToAdd)) {
            onSave({ ...settings, modelPriority: [...(settings.modelPriority || []), modelToAdd] });
            setModelToAdd('');
        }
    };
    
    const handleRemoveModelFromPriority = (modelId: string) => {
        onSave({ ...settings, modelPriority: (settings.modelPriority || []).filter(m => m !== modelId) });
    };

    const handleFactoryReset = async () => {
        const confirmed = await dialogService.confirm(
            t('factoryReset', 'settings'),
            t('resetConfirm', 'settings'),
            { destructive: true }
        );
        if (confirmed) {
            onSave({...settings, customProviders: [], mcpServers: []});
        }
    };

    const attentionOptions = [
        { value: 'economy', label: t('attentionFast', 'settings'), desc: t('attentionFastDesc', 'settings') },
        { value: 'default', label: t('attentionNormal', 'settings'), desc: t('attentionNormalDesc', 'settings') },
        { value: 'max', label: t('attentionDeep', 'settings'), desc: t('attentionDeepDesc', 'settings') }
    ];

    const budgetOptions = [ { value: 'low', label: t('budgetLow', 'settings') }, { value: 'medium', label: t('budgetMedium', 'settings') }, { value: 'high', label: t('budgetHigh', 'settings') } ];

    const currentAttention = ['plus', 'high', 'max'].includes(settings.contextSize) ? 'max' : settings.contextSize;
    const currentDesc = attentionOptions.find(o => o.value === currentAttention)?.desc || attentionOptions[1].desc;

    return {
        modelToAdd,
        setModelToAdd,
        allAvailableModels,
        attentionOptions,
        budgetOptions,
        currentAttention,
        currentDesc,
        handleChange,
        handleMemoryChange,
        handleAddModelToPriority,
        handleRemoveModelFromPriority,
        handleFactoryReset
    };
};
