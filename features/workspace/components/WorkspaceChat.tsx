
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChatMessage, AIPlan, AppSettings, GeneratedFile } from '../../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ThinkingCard } from './chat/ThinkingCard';
import { ChatInputArea } from './chat/ChatInputArea';
import { t } from '../../../services/i18n';
import { toast } from '../../../services/toastService';
import { TaskGroup } from './chat/TaskGroup';

interface WorkspaceChatProps {
  history: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isProcessing: boolean;
  thinkTime: number;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  currentReasoning: string;
  currentText?: string;
  onSend: (mode: 'modify' | 'explain', prompt?: string, options?: any) => void;
  onStop: () => void;
  onRollback: (snap: GeneratedFile[]) => void;
  onRegenerate: (messageId: string) => void;
  onReview: (msg: ChatMessage, prevSnapshot?: GeneratedFile[]) => void;
  onEnvVarSave: (messageId: string, vals: Record<string, string>) => void;
  isListening: boolean;
  toggleListening: () => void;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  aiPlan?: AIPlan;
  settings: AppSettings;
  onSaveSettings: (s: AppSettings) => void;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
}

// FIX: Added helper function to find last index in an array.
function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
        if (predicate(array[l], l, array))
            return l;
    }
    return -1;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<'modify' | 'explain'>('modify');

  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [props.history, props.isProcessing, props.currentReasoning, props.currentText, props.aiPlan]);

  const processedHistory = useMemo(() => {
    const result: any[] = [];
    const history = [...props.history];

    for (let i = 0; i < history.length; i++) {
        const currentMsg = history[i];

        if (currentMsg.role === 'user' && i + 1 < history.length) {
            const nextMsg = history[i + 1];
            if (nextMsg.role === 'model' && nextMsg.applied) {
                result.push({
                    type: 'group',
                    id: currentMsg.id,
                    userMsg: currentMsg,
                    modelMsg: nextMsg,
                });
                i++; // Skip next message
                continue;
            }
        }
        
        result.push({ type: 'message', id: currentMsg.id, msg: currentMsg });
    }

    return result;
  }, [props.history]);

  const { canUndo, snapshotToRestore } = useMemo(() => {
    const lastAppliedIdx = findLastIndex(props.history, m => m.role === 'model' && m.applied && !!m.snapshot);

    if (lastAppliedIdx === -1) {
        return { canUndo: false, snapshotToRestore: null };
    }
    
    const prevModelMsgWithSnapshotIdx = findLastIndex(props.history.slice(0, lastAppliedIdx), m => m.role === 'model' && !!m.snapshot);
    
    if (prevModelMsgWithSnapshotIdx !== -1) {
        const snapshot = props.history[prevModelMsgWithSnapshotIdx].snapshot;
        if (snapshot) {
            return { canUndo: true, snapshotToRestore: snapshot };
        }
    }
    
    return { canUndo: false, snapshotToRestore: null };
  }, [props.history]);

  const handleUndo = () => {
      if (canUndo && snapshotToRestore) {
        props.onRollback(snapshotToRestore);
        toast.info(t('lastChangeReverted', 'builder'));
      } else {
        toast.error(t('nothingToUndo', 'builder'));
      }
  };

  const handleSuggestionResponse = (msgId: string, action: string, payload: any) => {
      if (action === 'reuse') {
          const newPrompt = `Using the existing component \`${payload.file}\`, fulfill this request: "${payload.originalPrompt}"`;
          props.onSend('modify', newPrompt, { bypassInterceptors: true });
      } else if (action === 'create_new') {
          props.onSend('modify', payload.originalPrompt, { bypassInterceptors: true });
      } else if (action === 'submit_props') {
          const propsString = Object.entries(payload).map(([key, value]) => `${key}="${value}"`).join(' ');
          const newPrompt = `Using the component mentioned in my last prompt, render it with these properties: ${propsString}. My original request was: "${payload.originalPrompt}"`;
          props.onSend('modify', newPrompt, { bypassInterceptors: true });
      }
  };

  return (
    <>
    <div className={`fixed top-0 left-0 w-16 h-16 md:hidden z-40 transition-opacity duration-300 ${!props.isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => props.setCollapsed(true)}>
        <div className="absolute inset-0 bg-black/30"></div>
    </div>
    <button onClick={() => props.setCollapsed(false)} className={`md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-full shadow-lg transition-transform duration-300 ${props.isCollapsed ? 'translate-x-0' : '-translate-x-full'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    
    <div className={`fixed top-16 bottom-0 left-0 md:relative md:top-auto md:bottom-auto z-30 flex flex-col border-r bg-slate-50 transition-transform duration-300 shadow-xl md:shadow-none h-[calc(100vh-64px)] md:h-full w-[85vw] md:w-96 ${props.isCollapsed ? '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden' : 'translate-x-0'}`}>
        <div className="flex-shrink-0 p-3 border-b flex justify-between items-center bg-white">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                 <button onClick={() => setChatMode('modify')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${chatMode === 'modify' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('modeModify', 'builder')}</button>
                 <button onClick={() => setChatMode('explain')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${chatMode === 'explain' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('modeExplain', 'builder')}</button>
            </div>
            <button onClick={() => props.setCollapsed(true)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {processedHistory.map((item) => {
                    if (item.type === 'group') {
                        const modelMsgIndex = props.history.findIndex(h => h.id === item.modelMsg.id);
                        const prevModelMsg = props.history.slice(0, modelMsgIndex).reverse().find(m => m.role === 'model' && m.snapshot);
                        return (
                            <TaskGroup
                                key={item.id}
                                userMsg={item.userMsg}
                                modelMsg={item.modelMsg}
                                prevSnapshot={prevModelMsg?.snapshot}
                                onEnvVarSave={props.onEnvVarSave}
                                onRegenerate={props.onRegenerate}
                                settings={props.settings}
                                onSuggestionResponse={handleSuggestionResponse}
                            />
                        );
                    } else {
                        const msg = item.msg;
                        const idx = props.history.findIndex(h => h.id === msg.id);
                        const prevModelMsg = props.history.slice(0, idx).reverse().find(m => m.role === 'model' && m.snapshot);

                        return (
                            <ChatMessageItem 
                                key={msg.id}
                                msg={msg}
                                prevSnapshot={prevModelMsg?.snapshot}
                                onEnvVarSave={props.onEnvVarSave}
                                onRegenerate={props.onRegenerate}
                                onReview={msg.role === 'model' && msg.snapshot ? props.onReview : undefined}
                                onSuggestionResponse={handleSuggestionResponse}
                                settings={props.settings}
                            />
                        );
                    }
                })}
                
                {props.isProcessing && (
                    <ThinkingCard 
                        aiPlan={props.aiPlan} thinkTime={props.thinkTime}
                        currentReasoning={props.currentReasoning} currentText={props.currentText}
                        fileStatuses={props.fileStatuses}
                    />
                )}
            </div>
            
            {props.isOffline && (
                <div className="p-4 bg-amber-50 border-t border-amber-200 text-center animate-in fade-in">
                    <h4 className="font-bold text-amber-800 text-sm">⚠️ {t('offlineTitle', 'workspace')}</h4>
                    <p className="text-xs text-amber-700 mt-1 px-4">{t('offlineDesc', 'workspace')}</p>
                    <button onClick={() => props.setIsOffline(false)} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
                        {t('retryConnection', 'workspace')}
                    </button>
                </div>
            )}

            <ChatInputArea 
                chatInput={props.chatInput} setChatInput={props.setChatInput}
                isProcessing={props.isProcessing} isListening={props.isListening}
                toggleListening={props.toggleListening} 
                onSend={(prompt) => props.onSend(chatMode, prompt)}
                onStop={props.onStop} attachments={props.attachments}
                setAttachments={props.setAttachments} showSuggestions={props.history.length > 0 && !props.history.some(m => m.isAwaitingInput)}
                mode={chatMode}
                onUndo={handleUndo}
                canUndo={canUndo}
                settings={props.settings}
                onSaveSettings={props.onSaveSettings}
                history={props.history}
                isOffline={props.isOffline}
            />
        </div>
    </div>
    </>
  );
};
