import React from 'react';
import { ChatMessage } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { EnvVarRequestMessage } from './EnvVarRequestMessage';

interface Props {
    msg: ChatMessage;
    onRollback: (snapshot: any) => void;
    onEnvVarSave: (vals: Record<string, string>) => void;
}

export const ChatMessageItem: React.FC<Props> = ({ msg, onRollback, onEnvVarSave }) => {
    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group flex-col`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`max-w-[95%] p-3 rounded-xl text-xs sm:text-sm shadow-sm relative ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-700 w-full'}`}>
                    
                    {/* Restore Button */}
                    {msg.role === 'model' && msg.snapshot && (
                        <button onClick={() => onRollback(msg.snapshot)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-600" title="Restore version">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                        </button>
                    )}
                    
                    {/* Reasoning Display (Collapsible) */}
                    {msg.reasoning && msg.role === 'model' && (
                        <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                            <div 
                                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50/50 cursor-pointer flex justify-between items-center hover:bg-indigo-50"
                                onClick={(e) => e.currentTarget.nextElementSibling?.classList.toggle('hidden')}
                            >
                                <span>AI Reasoning</span>
                                <span className="text-indigo-400 text-[9px]">▼</span>
                            </div>
                            <div className="hidden p-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                                {msg.reasoning}
                            </div>
                        </div>
                    )}

                    {/* Token Usage Stats */}
                    {msg.usage && (
                        <div className={`absolute -bottom-5 ${msg.role==='user'?'right-0':'left-0'} text-[9px] text-slate-400 font-mono flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <span>In: {msg.usage.inputTokens}</span>
                            <span>Out: {msg.usage.outputTokens}</span>
                        </div>
                    )}

                    {msg.text && <div className="prose prose-sm max-w-none text-slate-700"><MarkdownRenderer content={msg.text} /></div>}
                    
                    {/* Modified Files Summary */}
                    {msg.modifiedFiles && msg.modifiedFiles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-2">Affected Files</div>
                            {msg.modifiedFiles.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span className="font-mono truncate">{f}</span>
                                    </div>
                            ))}
                        </div>
                    )}

                    {msg.requiredEnvVars && <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={onEnvVarSave} />}
                </div>
            </div>
        </div>
    );
};
