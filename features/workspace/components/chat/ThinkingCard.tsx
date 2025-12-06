
import React, { useState, useEffect } from 'react';
import { AIPlan } from '../../../../types';
import { MarkdownRenderer } from '../../../../components/ui/MarkdownRenderer';

interface Props {
    aiPlan?: AIPlan;
    thinkTime: number;
    currentReasoning: string;
    currentText?: string;
    fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
}

/**
 * Tarjeta "Thinking...".
 * Muestra el progreso del plan, el razonamiento colapsable y el estado de archivos en tiempo real.
 */
export const ThinkingCard: React.FC<Props> = ({ aiPlan, thinkTime, currentReasoning, currentText, fileStatuses }) => {
    const [showReasoning, setShowReasoning] = useState(true);

    // Auto-expandir razonamiento si llega nuevo contenido
    useEffect(() => { 
        if(currentReasoning) setShowReasoning(true); 
    }, [currentReasoning]);

    return (
        <div className="flex justify-start w-full">
            <div className="bg-white border border-indigo-100 p-4 rounded-xl w-full shadow-lg shadow-indigo-500/5 animate-in slide-in-from-bottom-2">
                    
                    {/* Barra de Progreso del Plan (Si existe) o Spinner Genérico */}
                    {aiPlan && aiPlan.totalSteps > 0 ? (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{aiPlan.currentTask}</span>
                                <span className="text-[10px] font-mono text-slate-400">{aiPlan.currentStep}/{aiPlan.totalSteps}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                                    style={{ width: `${(aiPlan.currentStep / aiPlan.totalSteps) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-50">
                            <div className="flex items-center gap-2">
                                <span className="animate-ping inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Building...</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{thinkTime.toFixed(1)}s</span>
                        </div>
                    )}
                    
                    {/* Razonamiento Desplegable */}
                    {currentReasoning && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowReasoning(!showReasoning)}>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Live Reasoning</span>
                                <span className={`text-[10px] transition-transform ${showReasoning ? 'rotate-180' : ''}`}>▼</span>
                            </div>
                            {showReasoning && (
                                <div className="mt-2 text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
                                    {currentReasoning}<span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Texto de Resumen Parcial */}
                    {currentText && <div className="mb-3 prose prose-sm max-w-none text-slate-700 text-xs"><MarkdownRenderer content={currentText} /></div>}

                    {/* Estado de Archivos */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        {Object.entries(fileStatuses).map(([file, status]) => (
                            <div key={file} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                                {status === 'pending' && <span className="animate-spin text-indigo-500 font-bold">⟳</span>}
                                {status === 'success' && <span className="text-emerald-500 font-bold">✓</span>}
                                {status === 'error' && <span className="text-red-500 font-bold">✗</span>}
                                <span className={`font-mono truncate ${status==='success'?'text-slate-700 font-semibold':'text-slate-500'}`}>{file}</span>
                            </div>
                        ))}
                    </div>
            </div>
        </div>
    );
};
