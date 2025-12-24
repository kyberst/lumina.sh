import React, { useState, useEffect, useMemo } from 'react';
import { AIPlan } from '../../../../types';
import { MarkdownRenderer } from '../../../../components/ui/MarkdownRenderer';
import { t } from '../../../../services/i18n';

interface Props {
    aiPlan?: AIPlan;
    thinkTime: number;
    currentReasoning: string;
    currentText?: string;
    fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
    statusOverride?: string;
}

export const ThinkingCard: React.FC<Props> = ({ aiPlan, thinkTime, currentReasoning, currentText, fileStatuses, statusOverride }) => {
    const [showReasoning, setShowReasoning] = useState(false);

    useEffect(() => { 
        if(currentReasoning.length > 50 && !showReasoning) setShowReasoning(true); 
    }, [currentReasoning]);

    const progress = useMemo(() => {
        if (!aiPlan || aiPlan.totalSteps === 0) return 0;
        return Math.min(100, Math.max(5, (aiPlan.currentStep / aiPlan.totalSteps) * 100));
    }, [aiPlan]);

    const displayStatus = useMemo(() => {
        if (statusOverride) return statusOverride;
        
        const hasFiles = Object.keys(fileStatuses).length > 0;
        if (progress < 15 && !hasFiles) return t('thinking.analyzing', 'journal');
        if (progress > 85 || hasFiles) return t('thinking.generating', 'journal');
        return t('thinking.evaluating', 'journal');
    }, [progress, fileStatuses, statusOverride]);

    return (
        <div className="flex justify-start w-full mb-4">
            <div className="relative overflow-hidden rounded-2xl w-full glass-panel border-primary/20 animate-in slide-in-from-bottom-2">
                
                {/* Abstract Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_50%)] animate-pulse"></div>
                </div>

                <div className="relative z-10 p-5">
                    {/* Header */}
                    <div className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </div>
                                <span className="text-sm font-bold text-foreground tracking-tight">{displayStatus}</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold bg-muted/50 px-2 py-1 rounded-lg border border-white/5">{thinkTime.toFixed(1)}s</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-primary via-indigo-400 to-primary background-animate transition-all duration-700 ease-out shadow-[0_0_10px_currentColor] text-primary" 
                                style={{ width: `${aiPlan ? progress : (thinkTime * 10) % 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Reasoning Accordion */}
                    {currentReasoning && (
                        <div className="mb-4">
                            <div 
                                className="flex items-center gap-2 cursor-pointer select-none group w-fit" 
                                onClick={() => setShowReasoning(!showReasoning)}
                            >
                                <div className={`transition-transform duration-200 text-muted-foreground ${showReasoning ? 'rotate-90' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors tracking-widest">
                                    {t('thinking.details', 'journal')}
                                </span>
                            </div>
                            
                            {showReasoning && (
                                <div className="mt-3 text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border/50 shadow-inner">
                                    {currentReasoning}
                                    <span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse align-middle"></span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Live Text Output */}
                    {currentText && (
                        <div className="mb-4 prose prose-sm max-w-none text-foreground/90 text-xs leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/50">
                            <MarkdownRenderer content={currentText} />
                        </div>
                    )}

                    {/* File Operations List */}
                    {Object.keys(fileStatuses).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border/30">
                            {Object.entries(fileStatuses).map(([file, status]) => (
                                <div key={file} className="flex items-center gap-2 text-[11px] bg-muted/30 p-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                                    {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />}
                                    {status === 'success' && <div className="text-emerald-500 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                                    {status === 'error' && <div className="text-red-500 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>}
                                    <span className={`font-mono truncate ${status==='success'?'text-foreground font-semibold':'text-muted-foreground'}`}>{file}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};