
import React from 'react';
import { ConsoleLog } from '../../../../types';
import { t } from '../../../../services/i18n';

interface Props {
  selectors: string[];
  selectedLogs?: ConsoleLog[];
  onUse: () => void;
  onRemove: (selector: string) => void;
  onRemoveLog?: (id: string) => void;
  onClear: () => void;
}

export const ChatContextTray: React.FC<Props> = ({ selectors, selectedLogs = [], onUse, onRemove, onRemoveLog, onClear }) => {
  const totalItems = selectors.length + selectedLogs.length;
  if (totalItems === 0) return null;

  return (
    <div className="p-3 bg-accent/20 border-t border-b border-border animate-in fade-in slide-in-from-top-2 shadow-inner">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{t('chatTray.selectedElements', 'workspace')} ({totalItems})</h4>
        <div className="flex gap-2">
          {/* 'Use in Chat' button removed as requested. Items are implicitly included. */}
          <button onClick={onClear} className="shadcn-btn shadcn-btn-outline bg-card h-7 px-3 text-xs border-primary/20 hover:border-destructive hover:text-destructive">{t('chatTray.clear', 'workspace')}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
        {/* CSS Selectors */}
        {selectors.map((selector, i) => (
          <div key={`sel-${i}`} className="bg-card text-xs font-mono px-2 py-1 rounded-md flex items-center gap-2 border border-border text-foreground shadow-sm animate-in zoom-in-95">
            <span className="truncate max-w-xs text-indigo-500 font-bold"># {selector}</span>
            <button onClick={() => onRemove(selector)} className="text-muted-foreground hover:text-destructive font-bold leading-none text-base transition-colors">&times;</button>
          </div>
        ))}

        {/* Console Logs */}
        {selectedLogs.map((log) => (
          <div key={`log-${log.id}`} className="bg-red-500/10 text-xs font-mono px-2 py-1 rounded-md flex items-center gap-2 border border-red-500/20 text-red-600 dark:text-red-400 shadow-sm animate-in zoom-in-95">
             <span className="font-bold text-[10px] uppercase bg-red-500 text-white px-1 rounded-sm">ERR</span>
             <span className="truncate max-w-[150px]">{log.msg}</span>
             <button onClick={() => onRemoveLog && onRemoveLog(log.id)} className="text-red-400 hover:text-red-700 font-bold leading-none text-base transition-colors">&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};
