
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
}

/**
 * Tarjeta "Thinking...".
 * Muestra el progreso del plan de forma amigable, ocultando la complejidad técnica.
 */
export const ThinkingCard: React.FC<Props> = ({ aiPlan, thinkTime, currentReasoning, currentText, fileStatuses }) => {
    const [showReasoning, setShowReasoning] = useState(false);

    // Auto-expandir razonamiento solo si hay contenido sustancial, pero mantenerlo colapsado por defecto para limpieza
    useEffect(() => { 
        if(currentReasoning.length > 50) setShowReasoning(true); 
    }, [currentReasoning]);

    // Calcular progreso
    const progress = useMemo(() => {
        if (!aiPlan || aiPlan.totalSteps === 0) return 0;
        return Math.min(100, Math.max(5, (aiPlan.currentStep / aiPlan.totalSteps) * 100));
    }, [aiPlan]);

    // Mapeo de Estados Amigables (Ocultar Jerga Técnica)
    const displayStatus = useMemo(() => {
        // Priority 1: Use the specific task from the AI plan if available
        if (aiPlan?.currentTask) {
            return aiPlan.currentTask;
        }

        const hasFiles = Object.keys(fileStatuses).length > 0;
        
        // Fase 1: Inicio
        if (progress < 15 && !hasFiles) return t('thinking.analyzing', 'builder');
        
        // Fase 3: Finalización / Generación de Archivos
        if (progress > 85 || hasFiles) return t('thinking.generating', 'builder');
        
        // Fase 2: Proceso
        return t('thinking.evaluating', 'builder');
    }, [progress, fileStatuses, aiPlan]);

    return (
        <div className="flex justify-start w-full">
            <div className="bg-white border border-indigo-100 p-5 rounded-2xl w-full shadow-lg shadow-indigo-500/5 animate-in slide-in-from-bottom-2 ring-1 ring-indigo-50">
                    
                    {/* Header: Estado y Progreso */}
                    <div className="mb-5">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2.5">
                                <div className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </div>
                                <span className="text-sm font-bold text-slate-700 tracking-tight animate-pulse">{displayStatus}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">{thinkTime.toFixed(1)}s</span>
                        </div>
                        
                        {/* Barra de Progreso Suave */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                style={{ width: `${aiPlan ? progress : (thinkTime * 10) % 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Razonamiento Desplegable (Detalles Ocultos por Defecto) */}
                    {currentReasoning && (
                        <div className="mb-4">
                            <div 
                                className="flex items-center gap-2 cursor-pointer select-none group w-fit" 
                                onClick={() => setShowReasoning(!showReasoning)}
                            >
                                <div className={`transition-transform duration-200 text-slate-400 ${showReasoning ? 'rotate-90' : ''}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-indigo-500 transition-colors tracking-widest">
                                    {t('thinking.details', 'builder')}
                                </span>
                            </div>
                            
                            {showReasoning && (
                                <div className="mt-3 text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-slate-50/50 p-3 rounded-lg border border-slate-100/50 shadow-inner">
                                    {currentReasoning}
                                    <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Texto de Resumen Parcial */}
                    {currentText && (
                        <div className="mb-4 prose prose-sm max-w-none text-slate-600 text-xs leading-relaxed bg-white p-2 rounded-lg">
                            <MarkdownRenderer content={currentText} />
                        </div>
                    )}

                    {/* Estado de Archivos (Solo si hay actividad) */}
                    {Object.keys(fileStatuses).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                            {Object.entries(fileStatuses).map(([file, status]) => (
                                <div key={file} className="flex items-center gap-2 text-[11px] bg-slate-50 p-2 rounded-md border border-slate-100 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                                    {status === 'pending' && <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />}
                                    {status === 'success' && <div className="text-emerald-500 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                                    {status === 'error' && <div className="text-red-500 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>}
                                    <span className={`font-mono truncate ${status==='success'?'text-slate-700 font-semibold':'text-slate-500'}`}>{file}</span>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </div>
    );
};