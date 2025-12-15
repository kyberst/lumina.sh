
import React, { useMemo } from 'react';
import { ChatMessage, GeneratedFile, AppSettings } from '../../../types';
import { t } from '../../../services/i18n';
import { FileDiff } from './FileDiff';
import { createPatch } from '../../../services/ai/diffUtils';
import { SyntaxHighlighter } from '../../../components/ui/SyntaxHighlighter';

// A simplified card to show diff inside the modal
const DiffViewer: React.FC<{ fileName: string, oldContent?: string, newContent: string, devMode: boolean }> = ({ fileName, oldContent, newContent, devMode }) => {
    const unifiedDiff = useMemo(() => devMode ? createPatch(fileName, oldContent || '', newContent) : '', [devMode, fileName, oldContent, newContent]);

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-mono text-sm font-bold text-slate-700">{fileName}</div>
            {devMode ? (
                <div className="bg-[#1e1e1e] p-3 text-xs overflow-x-auto max-h-[60vh] custom-scrollbar">
                    <SyntaxHighlighter code={unifiedDiff} language="diff" />
                </div>
            ) : (
                <FileDiff oldContent={oldContent || ''} newContent={newContent} />
            )}
        </div>
    );
};

interface Props {
    reviewData: { msg: ChatMessage; prevSnapshot?: GeneratedFile[] };
    onApply: (snapshot: GeneratedFile[], isCheckpoint: boolean) => void;
    onRollback: (snapshot: GeneratedFile[]) => void;
    onClose: () => void;
    settings: AppSettings;
}

export const ReviewFocusModal: React.FC<Props> = ({ reviewData, onApply, onRollback, onClose, settings }) => {
    const { msg, prevSnapshot } = reviewData;

    if (!msg.snapshot) return null;

    const modifiedFilesData = msg.modifiedFiles?.map(fileName => {
        const newFile = msg.snapshot!.find(f => f.name === fileName);
        const oldFile = prevSnapshot?.find(f => f.name === fileName);
        return {
            name: fileName,
            newContent: newFile?.content,
            oldContent: oldFile?.content,
        };
    }).filter(f => f.newContent !== undefined) || [];

    const handleApply = (isCheckpoint: boolean) => {
        onApply(msg.snapshot!, isCheckpoint);
    };

    const handleDiscard = () => {
        if (prevSnapshot) {
            onRollback(prevSnapshot);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex flex-col animate-in fade-in">
            {/* Header */}
            <header className="flex-shrink-0 h-20 px-6 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50">
                <div>
                    <h2 className="text-lg font-bold text-white">{t('reviewChangesTitle', 'builder')}</h2>
                    <p className="text-sm text-slate-400 truncate max-w-lg">{t('reviewChangesDesc', 'builder')}</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6">
                    {modifiedFilesData.map(file => (
                        <DiffViewer 
                            key={file.name}
                            fileName={file.name}
                            oldContent={file.oldContent}
                            newContent={file.newContent!}
                            devMode={settings.developerMode}
                        />
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 h-24 px-6 flex items-center justify-end gap-4 border-t border-slate-700/50 bg-slate-900/50">
                {prevSnapshot && (
                    <button onClick={handleDiscard} className="shadcn-btn bg-slate-700 text-white hover:bg-slate-600 h-12 px-6">
                        {t('proposal.discard', 'builder')}
                    </button>
                )}
                <button onClick={() => handleApply(true)} className="shadcn-btn bg-slate-50 border-2 border-slate-200 text-slate-600 hover:bg-slate-200 h-12 px-6 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    {t('applyAndCheckpoint', 'builder')}
                </button>
                <button onClick={() => handleApply(false)} className="shadcn-btn bg-green-500 hover:bg-green-600 text-white h-12 px-8 font-bold text-base">
                    {t('proposal.applyNow', 'builder')}
                </button>
            </footer>
        </div>
    );
};
