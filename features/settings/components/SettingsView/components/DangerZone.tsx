
import React from 'react';
import { t } from '../../../../../services/i18n';

interface Props {
  onFactoryReset: () => void;
}

export const DangerZone: React.FC<Props> = ({ onFactoryReset }) => {
  return (
    <div className="pt-8 border-t">
         <h3 className="text-sm font-medium text-red-500 mb-4">{t('dangerZone', 'settings')}</h3>
         <button onClick={onFactoryReset} className="shadcn-btn border-red-200 text-red-600 hover:bg-red-50">
            {t('factoryReset', 'settings')}
         </button>
    </div>
  );
};
