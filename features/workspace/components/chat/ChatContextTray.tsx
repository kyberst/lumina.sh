
import React from 'react';
import { t } from '../../../../services/i18n';

interface Props {
  selectors: string[];
  onUse: () => void;
  onRemove: (selector: string) => void;
  onClear: () => void;
}

export const ChatContextTray: React.FC<Props> = ({ selectors, onUse, onRemove, onClear }) => {
  if (selectors.length === 0) return null;

  return (
    <div className="p-3 bg-accent/20 border-t border-b border-border animate-in fade-in slide-in-from-top-2 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{t('chatTray.selectedElements', 'workspace')} ({selectors.length})</h4>
        <div className="flex gap-2">
          <button onClick={onUse} className="shadcn-btn shadcn-btn-primary h-7 px-3 text-xs">{t('chatTray.useInChat', 'workspace')}</button>
          <button onClick={onClear} className="shadcn-btn shadcn-btn-outline bg-card h-7 px-3 text-xs">{t('chatTray.clear', 'workspace')}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
        {selectors.map((selector, i) => (
          <div key={i} className="bg-card text-xs font-mono px-2 py-1 rounded-md flex items-center gap-2 border border-border text-foreground shadow-sm animate-in zoom-in-95">
            <span className="truncate max-w-xs">{selector}</span>
            <button onClick={() => onRemove(selector)} className="text-muted-foreground hover:text-destructive font-bold leading-none text-base transition-colors">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};
