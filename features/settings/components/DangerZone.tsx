import React from 'react';
import { SettingsCard } from './SettingsCard';
import { dialogService } from '../../../services/dialogService';
import { t } from '../../../services/i18n';

interface Props {
  onReset: () => void;
}

export const DangerZone: React.FC<Props> = ({ onReset }) => {
  const handleReset = async () => {
    const confirmed = await dialogService.confirm(
      t('resetAll', 'settings'),
      t('resetDesc', 'settings'),
      { destructive: true, confirmText: t('resetAll', 'settings') }
    );
    if (confirmed) {
      onReset();
    }
  };

  return (
    <SettingsCard title={t('dangerZone', 'settings')}>
      <div className="flex justify-between items-center p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
        <div>
          <h4 className="font-bold text-red-700">{t('resetAll', 'settings')}</h4>
          <p className="text-xs text-red-600/80 mt-1">{t('resetDesc', 'settings')}</p>
        </div>
        <button onClick={handleReset} className="shadcn-btn shadcn-btn-destructive whitespace-nowrap">
          {t('resetAll', 'settings')}
        </button>
      </div>
    </SettingsCard>
  );
};