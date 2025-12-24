
import React from 'react';
import { ChatMessage, GeneratedFile } from '../../../types';
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer';
import { EnvVarRequestMessage } from './EnvVarRequestMessage';
import { FileCard } from './FileCard';
import { t } from '../../../services/i18n';

interface Props {
    msg: ChatMessage;
    previousSnapshot?: GeneratedFile[];
    onEnvVarSave: (vals: Record<string, string>) => void;
    onRevert: (messageId: string) => void;
    isLastModelMessage: boolean;
    index: number;
}

export const ChatMessageItem: React.FC<Props> = ({ msg, previousSnapshot, onEnvVarSave, onRevert, isLastModelMessage, index }) => {
    // Guard: Prevent rendering empty bubbles (visual noise)
    const hasContent = 
        (msg.text && msg.text.trim().length > 0) || 
        (msg.reasoning && msg.reasoning.trim().length > 0) || 
        (msg.modifiedFiles && msg.modifiedFiles.length > 0) || 
        (msg.requiredEnvVars && msg.requiredEnvVars.length > 0) || 
        (msg.attachments && msg.attachments.length > 0) ||
        (msg.contextLogs && msg.contextLogs.length > 0) ||
        (msg.contextElements && msg.contextElements.length > 0) ||
        msg.pending;

    if (!hasContent) return null;

    // Logic for NO-LOSS Rule detection
    const justificationMatch = msg.reasoning?.match(/\[(?:JUSTIFIED DELETION|ELIMINACIÓN JUSTIFICADA)\]([\s\S]*?)(?:$|\[|<)/i);
    const hasJustifiedDeletion = !!justificationMatch;
    const justificationText = justificationMatch ? justificationMatch[1].trim() : '';

    const isModel = msg.role === 'model';
    const hasFiles = msg.modifiedFiles && msg.modifiedFiles.length > 0;

    // Determine Header Title
    let headerTitle = t('title', 'assistant'); // Default "Architect"
    let headerIcon = <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10"></path><path d="M12 12 2.1 12"></path></svg>;
    let headerColor = "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";

    if (hasFiles) {
        headerTitle = t('proposal.header', 'journal'); // "Update Applied"
        headerIcon = <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
        headerColor = "text-emerald-600 bg-emerald-500/20 border-emerald-500/20";
    }

    // Helper to find file content
    const getFileFromSnapshot = (filename: string): GeneratedFile | undefined => {
        return msg.snapshot?.find(f => f.name === filename);
    };
    
    const getOriginalFile = (filename: string): GeneratedFile | undefined => {
        return previousSnapshot?.find(f => f.name === filename);
    };

    // Clean reasoning of technical tags for display
    const displayReasoning = msg.reasoning 
        ? msg.reasoning
            .replace(/\[JUSTIFIED DELETION\][\s\S]*?(?:$|\[|<)/g, '')
            .replace(/\[ELIMINACIÓN JUSTIFICADA\][\s\S]*?(?:$|\[|<)/g, '')
            .trim()
        : '';

    // Stagger Animation Delay
    const animationDelay = `${index * 100}ms`;

    return (
        <div 
            className={`flex ${isModel ? 'justify-start' : 'justify-end'} group flex-col mb-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards`}
            style={{ animationDelay }}
        >
            <div className={`flex ${isModel ? 'justify-start' : 'justify-end'} w-full`}>
                <div className={`
                    relative max-w-[85%] rounded-2xl shadow-sm text-sm overflow-hidden transition-all duration-300
                    ${isModel 
                        ? 'bg-card border border-border/60 rounded-tl-sm' 
                        : 'bg-primary text-white shadow-md shadow-primary/20 rounded-tr-sm'
                    }
                    ${msg.pending ? 'opacity-90' : 'opacity-100'}
                `}>
                    
                    {/* Header for AI Messages */}
                    {isModel && (
                        <div className="bg-muted/30 border-b border-border/50 px-3 py-2 flex justify-between items-center select-none">
                            <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${headerColor}`}>
                                    {headerIcon}
                                </div>
                                <h3 className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">{headerTitle}</h3>
                            </div>
                            <span className="text-[9px] font-mono text-muted-foreground opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    )}

                    <div className={`p-3 ${isModel ? 'space-y-3' : ''}`}> 
                        
                        {/* Deletion Warning */}
                        {hasJustifiedDeletion && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3 backdrop-blur-sm">
                                <div className="text-amber-500 shrink-0 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                                        {t('deletionWarningTitle', 'journal')}
                                    </h4>
                                    {justificationText && (
                                        <p className="text-xs text-amber-800 dark:text-amber-200 font-medium italic">
                                            "{justificationText}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Architectural Plan (Reasoning) */}
                        {displayReasoning && isModel && (
                            <div className="rounded-lg border border-border/50 bg-background/50">
                                <details className="group/details">
                                    <summary className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors list-none select-none">
                                        <span className="transition-transform duration-200 group-open/details:rotate-90">▶</span>
                                        {t('archPlan', 'insight')}
                                    </summary>
                                    <div className="px-3 pb-3 pt-0 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                                        {displayReasoning}
                                    </div>
                                </details>
                            </div>
                        )}

                        {/* Main Text Content */}
                        {msg.text && (
                            <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:my-1 ${isModel ? 'text-foreground/90' : 'text-white font-medium'}`}>
                                <MarkdownRenderer content={msg.text} />
                            </div>
                        )}

                        {/* ATTACHED VISUAL CONTEXT (ELEMENTS) */}
                        {msg.contextElements && msg.contextElements.length > 0 && (
                            <div className={`mt-2 rounded-lg overflow-hidden border border-white/10 ${isModel ? 'bg-indigo-50/50' : 'bg-white/10'}`}>
                                <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                                    Sent Visual Context
                                </div>
                                <div className="px-3 pb-2 text-[10px] font-mono leading-snug">
                                    {msg.contextElements.map((selector, i) => (
                                        <div key={i} className="truncate opacity-80">
                                            {selector}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ATTACHED CONTEXT (ERRORS) */}
                        {msg.contextLogs && msg.contextLogs.length > 0 && (
                            <div className={`mt-3 rounded-xl overflow-hidden border ${isModel ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}>
                                <div className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${isModel ? 'text-slate-500 bg-slate-100' : 'text-white/60 bg-black/20'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    Attached Context
                                </div>
                                <div className="divide-y divide-white/10">
                                    {msg.contextLogs.map((log) => (
                                        <details key={log.id} className="group/error open:bg-black/5 transition-colors">
                                            <summary className="px-3 py-2 cursor-pointer list-none flex items-start gap-2 hover:bg-white/5 transition-colors">
                                                <span className={`text-[10px] mt-0.5 transition-transform group-open/error:rotate-90 ${isModel ? 'text-slate-400' : 'text-white/50'}`}>▶</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-mono truncate ${log.type === 'error' ? 'text-red-300 font-bold' : 'text-amber-200'}`}>
                                                        {log.msg}
                                                    </div>
                                                    {log.source && (
                                                        <div className={`text-[9px] ${isModel ? 'text-slate-400' : 'text-white/40'}`}>
                                                            {log.source.file}:{log.source.line}
                                                        </div>
                                                    )}
                                                </div>
                                            </summary>
                                            <div className="px-8 pb-3 pt-0">
                                                <pre className={`text-[10px] font-mono whitespace-pre-wrap break-all p-2 rounded-md ${isModel ? 'bg-white border border-slate-200 text-slate-700' : 'bg-black/30 text-white/80'}`}>
                                                    {log.msg}
                                                </pre>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Modified Files List */}
                        {hasFiles && (
                            <div className="pt-2 border-t border-border/50 mt-2">
                                <div className="space-y-2">
                                    {msg.modifiedFiles!.map(filename => {
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
                                            <div key={filename} className="flex items-center gap-3 text-xs text-muted-foreground bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20 font-mono opacity-80">
                                                <span className="line-through decoration-destructive/50 font-bold">{t('file.deleted', 'journal')}</span>
                                                <span className="truncate flex-1 text-destructive/80">{filename}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {msg.requiredEnvVars && <EnvVarRequestMessage requests={msg.requiredEnvVars} saved={msg.envVarsSaved || false} onSave={onEnvVarSave} />}
                    </div>
                    
                    {/* User Metadata Footer (Date) */}
                    {!isModel && (
                        <div className="px-4 pb-2 pt-0 flex justify-end">
                             <span className="text-[9px] font-mono text-white/50">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    )}

                    {/* Revert Button for Model */}
                    {isModel && hasFiles && (
                        <div className="px-4 pb-3 pt-0 flex justify-end">
                            <button
                                onClick={() => onRevert(msg.refactor_history_id)}
                                disabled={isLastModelMessage}
                                className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                                title={isLastModelMessage ? "Current Version" : "Restore this version"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                {t('proposal.discard', 'journal')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
