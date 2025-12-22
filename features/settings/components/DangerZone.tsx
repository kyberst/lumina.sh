
import React from 'react';
import { SettingsCard } from './SettingsCard';
import { dialogService } from '../../../services/dialogService';
import { t } from '../../../services/i18n';

interface Props {
  onReset: () => void;
  onClearProjects: () => void;
}

export const DangerZone: React.FC<Props> = ({ onReset, onClearProjects }) => {
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

  const handleClearProjects = async () => {
    const confirmed = await dialogService.confirm(
        t('clearWorkspaceConfirm', 'settings'),
        t('clearWorkspaceConfirmDesc', 'settings'),
        { destructive: true, confirmText: t('clearWorkspaceBtn', 'settings') }
    );
    if (confirmed) {
        onClearProjects();
    }
  };

  return (
    <SettingsCard title={t('dangerZone', 'settings')}>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 border border-orange-500/20 bg-orange-500/5 rounded-lg">
            <div>
            <h4 className="font-bold text-orange-700 text-sm">{t('clearWorkspaceTitle', 'settings')}</h4>
            <p className="text-[11px] text-orange-600/80 mt-1">{t('clearWorkspaceDesc', 'settings')}</p>
            </div>
            <button onClick={handleClearProjects} className="shadcn-btn shadcn-btn-outline border-orange-200 text-orange-700 hover:bg-orange-100 whitespace-nowrap text-xs">
            {t('clearWorkspaceBtn', 'settings')}
            </button>
        </div>

        <div className="flex justify-between items-center p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
            <div>
            <h4 className="font-bold text-red-700 text-sm">{t('resetAll', 'settings')}</h4>
            <p className="text-[11px] text-red-600/80 mt-1">{t('resetDesc', 'settings')}</p>
            </div>
            <button onClick={handleReset} className="shadcn-btn shadcn-btn-destructive whitespace-nowrap text-xs">
            {t('resetAll', 'settings')}
            </button>
        </div>
      </div>
    </SettingsCard>
  );
};
