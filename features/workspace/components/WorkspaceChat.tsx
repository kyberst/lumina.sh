
import React, { useRef, useEffect } from 'react';
import { ChatMessage, AIPlan } from '../../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ThinkingCard } from './chat/ThinkingCard';
import { ChatInputArea } from './chat/ChatInputArea';

interface WorkspaceChatProps {
  history: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isProcessing: boolean;
  thinkTime: number;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  currentReasoning: string;
  currentText?: string;
  onSend: () => void;
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
                {props.history.map(msg => <ChatMessageItem key={msg.id} msg={msg} onRollback={props.onRollback} onEnvVarSave={props.onEnvVarSave} />)}
                
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

            {/* Área de Input */}
            <ChatInputArea 
                chatInput={props.chatInput}
                setChatInput={props.setChatInput}
                isProcessing={props.isProcessing}
                isListening={props.isListening}
                toggleListening={props.toggleListening}
                onSend={props.onSend}
                onStop={props.onStop}
                attachments={props.attachments}
                setAttachments={props.setAttachments}
            />
        </div>
    </div>
    </>
  );
};
