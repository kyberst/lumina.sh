import React from 'react';
import { ChatMessage } from '../../../types';
import { t } from '../../../services/i18n';

interface Props {
  history: ChatMessage[];
  onRevert: (messageId: string) => void;
}

export const WorkspaceHistory: React.FC<Props> = ({ history, onRevert }) => {
  const modelTurns = [...history]
    .filter(m => m.role === 'model' && m.snapshot && m.modifiedFiles && m.modifiedFiles.length > 0)
    .reverse();

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 font-['Plus_Jakarta_Sans']">{t('history', 'builder')}</h2>
                <p className="text-slate-500 text-sm">{t('history.desc', 'workspace')}</p>
            </div>
            
            <div className="space-y-4">
                {modelTurns.map((turn, index) => (
                    <div key={turn.refactor_history_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                             <div>
                                <div className="text-xs font-bold text-indigo-600 mb-1">{new Date(turn.timestamp).toLocaleString()}</div>
                                <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
                                    {turn.text || "Code Generation"}
                                </p>
                             </div>
                             <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-full whitespace-nowrap ml-4">
                                V{modelTurns.length - index}
                             </span>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                             <div className="text-xs text-slate-400">
                                {turn.modifiedFiles?.length || 0} {t('history.filesChanged', 'workspace')}
                             </div>
                             <button
                                onClick={() => onRevert(turn.refactor_history_id)}
                                disabled={index === 0}
                                className="shadcn-btn shadcn-btn-outline h-8 px-3 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                {t('restore', 'assistant')}
                             </button>
                        </div>
                    </div>
                ))}
                {modelTurns.length === 0 && (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <p>{t('history.empty', 'workspace')}</p>
                        <p className="text-xs mt-1">{t('history.emptyDesc', 'workspace')}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};