
import React, { useState } from 'react';
import { ChatMessage, GeneratedFile } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { EnvVarRequestMessage } from './EnvVarRequestMessage';
import { FileCard } from './FileCard';
import { t } from '../../../services/i18n';

interface Props {
    msg: ChatMessage;
    onEnvVarSave: (vals: Record<string, string>) => void;
    onRevert: (messageId: string) => void;
    isLastModelMessage: boolean;
}

export const ChatMessageItem: React.FC<Props> = ({ msg, onEnvVarSave, onRevert, isLastModelMessage }) => {
    // Logic for NO-LOSS Rule detection - Check for English or Spanish tag
    const justificationMatch = msg.reasoning?.match(/\[(?:JUSTIFIED DELETION|ELIMINACIÓN JUSTIFICADA)\]([\s\S]*?)(?:$|\[|<)/i);
    const hasJustifiedDeletion = !!justificationMatch;
    const justificationText = justificationMatch ? justificationMatch[1].trim() : '';

    const isModel = msg.role === 'model';

    // Helper to find file content from snapshot if available
    const getFileFromSnapshot = (filename: string): GeneratedFile | undefined => {
        return msg.snapshot?.find(f => f.name === filename);
    };
    
    const getOriginalFile = (filename: string): GeneratedFile | undefined => {
        return undefined;
    };


    // Clean reasoning of technical tags for display
    const displayReasoning = msg.reasoning 
        ? msg.reasoning
            .replace(/\[JUSTIFIED DELETION\][\s\S]*?(?:$|\[|<)/g, '')
            .replace(/\[ELIMINACIÓN JUSTIFICADA\][\s\S]*?(?:$|\[|<)/g, '')
            .trim()
        : '';

    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group flex-col mb-6 animate-in slide-in-from-bottom-2`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`max-w-[95%] sm:max-w-[90%] rounded-2xl text-xs sm:text-sm shadow-md relative overflow-hidden border transition-all hover:shadow-lg ${isModel ? 'border-slate-200 bg-white' : 'border-indigo-600 bg-indigo-600 text-white'}`}>
                    
                    {isModel && (
                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center select-none bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">{t('proposal.header', 'journal')}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">{t('proposal.agent', 'journal')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`p-5`}> 
                        
                        {hasJustifiedDeletion && (
                            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 animate-in fade-in slide-in-from-top-1">
                                <div className="text-amber-500 shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
                                        {t('deletionWarningTitle', 'journal')}
                                    </h4>
                                    <p className="text-xs text-amber-700 leading-relaxed mb-2">
                                        {t('deletionWarningDesc', 'journal')}
                                    </p>
                                    {justificationText && (
                                        <div className="text-[11px] bg-white/60 p-2 rounded border border-amber-200/50 text-amber-900 font-medium italic border-l-2 border-l-amber-400">
                                            "{justificationText}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {displayReasoning && isModel && (
                            <div className={`mb-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50`}>
                                <div 
                                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer flex justify-between items-center hover:bg-slate-100/50 transition-colors"
                                    onClick={(e) => e.currentTarget.nextElementSibling?.classList.toggle('hidden')}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                        {t('archPlan', 'insight')}
                                    </span>
                                    <span className="text-slate-400 text-[9px]">▼</span>
                                </div>
                                <div className="p-4 pt-2 text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar border-t border-slate-200/50">
                                    {displayReasoning}
                                </div>
                            </div>
                        )}

                        {msg.text && (
                            <div className={`prose prose-sm max-w-none mb-6 ${isModel ? 'text-slate-600' : 'text-white'}`}>
                                <MarkdownRenderer content={msg.text} />
                            </div>
                        )}
                        
                        {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                            <div className="mt-6 pt-2">
                                <h4 className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 tracking-wider mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                    {t('proposal.changes', 'journal')}
                                    <span className="text-[10px] font-normal text-slate-400 normal-case ml-auto">
                                        {msg.modifiedFiles.length} {t('proposal.files', 'journal')}
                                    </span>
                                </h4>
                                
                                <div className="space-y-3">
                                    {msg.modifiedFiles.map(filename => {
                                        const fileContent = getFileFromSnapshot(filename);
                                        const originalContent = getOriginalFile(filename);
                                        
                                        if (fileContent) {
                                            return (
                                                <FileCard 
                                                    key={filename} 
                                                    file={fileContent} 
                                                    originalFile={originalContent}
                                                    isNew={msg.role === 'model'} 
                                                />
                                            );
                                        }
                                        return (
                                            <div key={filename} className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 font-mono opacity-75">
                                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                <span className="line-through text-slate-400 font-bold">{t('file.deleted', 'journal')}</span>
                                                <span className="truncate flex-1">{filename}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {msg.requiredEnvVars && <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={onEnvVarSave} />}
                    </div>
                    
                    {isModel && msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                        <div className="px-5 pb-4 pt-2 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => onRevert(msg.id)}
                                disabled={isLastModelMessage}
                                className="shadcn-btn shadcn-btn-outline h-7 text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isLastModelMessage ? "Cannot revert the most recent change" : "Revert the changes from this step"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                Revert Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
