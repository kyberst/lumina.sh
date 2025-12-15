
import React from 'react';
import { Snapshot } from '../../../../types';
import { t } from '../../../../services/i18n';
import { dialogService } from '../../../../services/dialogService';

interface Props {
    history: Snapshot[];
    onRestore: (snapshot: Snapshot) => void;
}

export const HistoryList: React.FC<Props> = ({ history, onRestore }) => {
    
    const handleRestoreClick = async (snap: Snapshot) => {
        const confirmed = await dialogService.confirm(
            t('restoreTitle', 'workspace'),
            t('restoreDesc', 'workspace'),
            { confirmText: t('restoreConfirm', 'workspace') }
        );
        if (confirmed) {
            onRestore(snap);
        }
    };

    if (!history || history.length === 0) {
        return (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8 text-center">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('history', 'builder')}</h3>
                <p className="text-xs text-slate-400 italic">{t('noHistory', 'workspace')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                {t('history', 'builder')}
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{history.length}</span>
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {history.map((snap) => (
                    <div key={snap.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all group">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{new Date(snap.timestamp).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{snap.description} • {snap.files.length} files</span>
                        </div>
                        <button 
                            onClick={() => handleRestoreClick(snap)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-all shadow-sm"
                        >
                            {t('restore', 'assistant')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
