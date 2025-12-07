
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, AIPlan } from '../../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ThinkingCard } from './chat/ThinkingCard';
import { ChatInputArea } from './chat/ChatInputArea';
import { t } from '../../../services/i18n';

interface WorkspaceChatProps {
  history: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isProcessing: boolean;
  thinkTime: number;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  currentReasoning: string;
  currentText?: string;
  onSend: (mode: 'modify' | 'explain') => void; // Update signature
  onStop: () => void;
  onRollback: (snap: any) => void;
  onEnvVarSave: (vals: Record<string, string>) => void;
  isListening: boolean;
  toggleListening: () => void;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  aiPlan?: AIPlan;
}

/**
 * WorkspaceChat: Contenedor principal del chat.
 * Gestiona el scroll, la lista de mensajes, y el layout adaptable (móvil/escritorio).
 */
export const WorkspaceChat: React.FC<WorkspaceChatProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<'modify' | 'explain'>('modify');

  // Auto-scroll al final cuando hay nuevos mensajes o actividad de IA
  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [props.history, props.isProcessing, props.currentReasoning, props.currentText, props.aiPlan]);

  return (
    <>
    {/* Overlay para Móvil */}
    <div className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} onClick={() => props.setCollapsed(true)} />
    
    {/* Botón Flotante para expandir (Móvil) */}
    <button onClick={() => props.setCollapsed(false)} className={`fixed left-0 top-20 w-8 h-10 bg-indigo-600 rounded-r-lg flex items-center justify-center shadow-md text-white cursor-pointer md:hidden z-[60] transition-transform duration-300 ${props.isCollapsed ? 'translate-x-0' : '-translate-x-full'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>

    <div className={`fixed top-16 bottom-0 left-0 md:relative md:top-auto md:bottom-auto z-30 flex flex-col border-r bg-slate-50 transition-transform duration-300 shadow-xl md:shadow-none h-[calc(100vh-64px)] md:h-full w-[85vw] md:w-96 ${props.isCollapsed ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden' : 'translate-x-0'}`}>
        
        {/* Botón cerrar Móvil */}
        <button onClick={() => props.setCollapsed(!props.isCollapsed)} className={`absolute -right-10 top-4 w-10 h-10 bg-white border-l-0 border rounded-r-lg flex items-center justify-center shadow-md text-slate-500 cursor-pointer md:hidden ${props.isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>X</button>

        {/* Botón Desktop Collapse */}
        <button onClick={() => props.setCollapsed(!props.isCollapsed)} className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-r-lg hidden md:flex items-center justify-center z-30 shadow-sm text-slate-400 hover:text-indigo-600 cursor-pointer hover:w-8 transition-all">{props.isCollapsed ? '>' : '<'}</button>

        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Lista de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {props.history.map((msg, idx) => {
                    // Look back for the nearest previous Model message to establish "Before" context for diffing
                    const prevModelMsg = props.history.slice(0, idx).reverse().find(m => m.role === 'model' && m.snapshot);
                    const prevSnapshot = prevModelMsg ? prevModelMsg.snapshot : undefined;

                    return (
                        <ChatMessageItem 
                            key={msg.id} 
                            msg={msg} 
                            prevSnapshot={prevSnapshot}
                            onRollback={props.onRollback} 
                            onEnvVarSave={props.onEnvVarSave} 
                        />
                    );
                })}
                
                {/* Tarjeta de Pensamiento en Vivo */}
                {props.isProcessing && (
                    <ThinkingCard 
                        aiPlan={props.aiPlan}
                        thinkTime={props.thinkTime}
                        currentReasoning={props.currentReasoning}
                        currentText={props.currentText}
                        fileStatuses={props.fileStatuses}
                    />
                )}
            </div>

            {/* Mode Switcher */}
            <div className="px-4 pb-2">
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setChatMode('modify')} 
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${chatMode === 'modify' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        {t('modeModify', 'builder')}
                    </button>
                    <button 
                        onClick={() => setChatMode('explain')} 
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${chatMode === 'explain' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        {t('modeExplain', 'builder')}
                    </button>
                </div>
            </div>

            {/* Área de Input */}
            <ChatInputArea 
                chatInput={props.chatInput}
                setChatInput={props.setChatInput}
                isProcessing={props.isProcessing}
                isListening={props.isListening}
                toggleListening={props.toggleListening}
                onSend={() => props.onSend(chatMode)}
                onStop={props.onStop}
                attachments={props.attachments}
                setAttachments={props.setAttachments}
                showSuggestions={props.history.length > 0}
                mode={chatMode}
            />
        </div>
    </div>
    </>
  );
};
