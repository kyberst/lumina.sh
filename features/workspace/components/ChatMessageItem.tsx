
import React, { useState } from 'react';
import { ChatMessage, GeneratedFile, AppSettings } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { EnvVarRequestMessage } from './EnvVarRequestMessage';
import { FileCard } from './FileCard';
import { t } from '../../../services/i18n';
import { dialogService } from '../../../../services/dialogService';
import { SyntaxHighlighter } from '../../../../components/ui/SyntaxHighlighter';
import { IntelligentSuggestions } from './chat/IntelligentSuggestions';

interface Props {
    msg: ChatMessage;
    prevSnapshot?: GeneratedFile[];
    onRegenerate: (messageId: string) => void;
    onReview?: (msg: ChatMessage, prevSnapshot?: GeneratedFile[]) => void;
    onEnvVarSave: (messageId: string, vals: Record<string, string>) => void;
    onSuggestionResponse: (msgId: string, action: string, payload: any) => void;
    settings: AppSettings;
}

export const ChatMessageItem: React.FC<Props> = ({ msg, prevSnapshot, onEnvVarSave, onRegenerate, onReview, onSuggestionResponse, settings }) => {
    const [collapsed, setCollapsed] = useState(!!msg.applied);
    
    // Logic for NO-LOSS Rule detection - Check for English or Spanish tag
    const justificationMatch = msg.reasoning?.match(/\[(?:JUSTIFIED DELETION|ELIMINACIÓN JUSTIFICADA)\]([\s\S]*?)(?:$|\[|<)/i);
    const hasJustifiedDeletion = !!justificationMatch;
    const justificationText = justificationMatch ? justificationMatch[1].trim() : '';

    const isModel = msg.role === 'model';
    const { developerMode } = settings;
    const totalTokens = (msg.usage?.inputTokens || 0) + (msg.usage?.outputTokens || 0);
    const hasPatches = msg.patches && Object.keys(msg.patches).length > 0;

    const handleViewPatch = () => {
        if (!msg.patches) return;
        
        const patchContent = Object.entries(msg.patches)
            .map(([filename, patch]) => {
                const p = patch as string; // Fix: Explicit cast for TS
                if (p.startsWith('--- a/')) return p;
                return `--- a/${filename}\n+++ b/${filename}\n${p}`;
            })
            .join('\n\n');

        dialogService.custom(t('rawPatchTitle', 'builder'), 
            <div className="max-h-[60vh] overflow-auto custom-scrollbar bg-[#1e1e1e] p-4 rounded-lg border border-slate-700">
                <SyntaxHighlighter code={patchContent} language="diff" />
            </div>
        );
    };

    const getFileFromSnapshot = (filename: string): GeneratedFile | undefined => {
        return msg.snapshot?.find(f => f.name === filename);
    };
    
    const getOriginalFile = (filename: string): GeneratedFile | undefined => {
        return prevSnapshot?.find(f => f.name === filename);
    };

    const displayReasoning = msg.reasoning 
        ? msg.reasoning
            .replace(/\[JUSTIFIED DELETION\][\s\S]*?(?:$|\[|<)/g, '')
            .replace(/\[ELIMINACIÓN JUSTIFICADA\][\s\S]*?(?:$|\[|<)/g, '')
            .trim()
        : '';

    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group flex-col mb-6 animate-in slide-in-from-bottom-2`}>
            <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                
                {msg.role === 'user' && (
                    <button 
                        onClick={() => onRegenerate(msg.id)}
                        title={t('regenerateResponse', 'assistant')}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                )}

                <div className={`max-w-[95%] sm:max-w-[90%] rounded-2xl text-xs sm:text-sm shadow-md relative overflow-hidden border transition-all hover:shadow-lg ${isModel ? 'border-slate-200 bg-white' : 'border-indigo-600 bg-indigo-600 text-white'}`}>
                    
                    {isModel && !msg.isAwaitingInput && (
                        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center select-none bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border ${msg.applied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                    {msg.applied ? t('proposal.applied', 'builder') : t('proposal.header_dev', 'builder')}
                                </span>
                                {msg.checkpointName && (
                                    <div className="flex items-center gap-1.5 text-amber-600" title={msg.checkpointName}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                        <span className="text-xs font-bold">{t('checkpoint', 'builder')}</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full">
                                {collapsed ? <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M12 20V4"/><path d="m4 12 8 8 8-8"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M12 4v16"/><path d="m20 12-8-8-8 8"/></svg>}
                            </button>
                        </div>
                    )}

                    <div className={`p-5 ${collapsed && isModel ? 'hidden' : ''}`}>
                        
                        {msg.simplifiedText && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-4">
                                <div className="font-bold uppercase text-[10px] text-slate-400 mb-1">{t('interpretation', 'workspace')}</div>
                                <p className="text-slate-600 italic">{msg.simplifiedText}</p>
                            </div>
                        )}
                        
                        {msg.text && <div className={`prose prose-sm max-w-none ${isModel ? 'text-slate-600' : 'text-white'} ${msg.simplifiedText ? 'mb-4' : 'mb-0'}`}><MarkdownRenderer content={msg.text} /></div>}
                        
                        {(msg.suggestions || msg.propInputs) && (
                            <IntelligentSuggestions msg={msg} onSuggestionResponse={onSuggestionResponse} />
                        )}

                        {isModel && developerMode && (displayReasoning || hasJustifiedDeletion || msg.audit) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] font-mono">
                                {displayReasoning && <pre className="whitespace-pre-wrap text-slate-400 bg-slate-50 p-2 rounded">{displayReasoning}</pre>}
                                {hasJustifiedDeletion && (
                                    <div className="mt-2 p-3 bg-amber-50 border-l-4 border-amber-400 text-amber-800">
                                        <h4 className="font-bold">{t('deletionWarningTitle_dev', 'builder')}</h4>
                                        <p className="text-xs italic mt-1">{justificationText}</p>
                                    </div>
                                )}
                                {msg.audit && (
                                    <details className="mt-3 text-[10px] cursor-pointer">
                                        <summary className="font-bold text-slate-400 uppercase tracking-wider">{t('auditHeader', 'builder')}</summary>
                                        <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-slate-50 rounded">
                                            <div><strong className="text-slate-500">{t('auditTokens', 'builder')}:</strong> {msg.audit.tokenUsage.input + msg.audit.tokenUsage.output}</div>
                                            <div><strong className="text-slate-500">{t('auditModel', 'builder')}:</strong> {msg.audit.model}</div>
                                            <div><strong className="text-slate-500">{t('auditProvider', 'builder')}:</strong> {msg.audit.provider}</div>
                                            {msg.audit.thinkingBudget && <div><strong className="text-slate-500">{t('auditBudget', 'builder')}:</strong> {msg.audit.thinkingBudget}</div>}
                                            {msg.audit.contextSize && <div><strong className="text-slate-500">{t('auditContext', 'builder')}:</strong> {msg.audit.contextSize}</div>}
                                            {hasPatches && <button onClick={handleViewPatch} className="text-indigo-600 hover:underline">{t('viewPatch', 'builder')}</button>}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}

                        {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                            <div className="space-y-2 mt-4">
                                {msg.modifiedFiles.map(fn => {
                                    const file = getFileFromSnapshot(fn);
                                    if (!file) return null;
                                    return <FileCard key={fn} file={file} originalFile={getOriginalFile(fn)} isNew={true} settings={settings} />;
                                })}
                            </div>
                        )}

                        {msg.requiredEnvVars && <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={(vals) => onEnvVarSave(msg.id, vals)} />}

                        {isModel && onReview && msg.snapshot && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <button onClick={() => onReview(msg, prevSnapshot)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 text-base">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20V4"/><path d="m4 12 8 8 8-8"/></svg>
                                    {t('reviewAndApply', 'builder')}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {collapsed && (
                        <div className="p-4 text-xs italic text-slate-400 bg-slate-50/50">
                            {msg.checkpointName || `${t('taskCompleted', 'builder')}: "${msg.text.substring(0, 50)}..."`}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
