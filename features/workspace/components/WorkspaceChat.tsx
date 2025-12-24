import React, { useRef, useEffect } from 'react';
import { ChatMessage, AIPlan, ConsoleLog, AppSettings } from '../../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { ThinkingCard } from './chat/ThinkingCard';
import { ChatInputArea } from './chat/ChatInputArea';
import { ChatContextTray } from './chat/ChatContextTray';
import { t } from '../../../services/i18n';

interface ModelOption {
    id: string;
    name: string;
}

interface WorkspaceChatProps {
  history: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isProcessing: boolean;
  isHistoryLoading: boolean;
  isIntegrityChecking: boolean;
  thinkTime: number;
  fileStatuses: Record<string, 'pending' | 'success' | 'error'>;
  currentReasoning: string;
  currentText?: string;
  onSend: () => void;
  onStop: () => void;
  onEnvVarSave: (vals: Record<string, string>) => void;
  isListening: boolean;
  toggleListening: () => void;
  attachments: any[];
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  aiPlan?: AIPlan;
  suggestions?: string[];
  onRevert: (messageId: string) => void;
  chatContextSelectors: string[];
  selectedLogs: ConsoleLog[];
  onUseSelectorsInChat: () => void;
  onRemoveSelector: (s: string) => void;
  onRemoveLog: (id: string) => void;
  onClearSelectors: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  availableModels: ModelOption[];
  settings: AppSettings;
  selectedProvider: string;
  onProviderChange: (pId: string) => void;
  statusOverride?: string; // New prop
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [props.history, props.isProcessing, props.currentReasoning, props.currentText, props.aiPlan, props.isHistoryLoading]);

  const lastModelMessageId = [...props.history].reverse().find(m => m.role === 'model' && m.modifiedFiles && m.modifiedFiles.length > 0)?.refactor_history_id;

  return (
    <div className="flex flex-col border-r border-border bg-background/50 backdrop-blur-sm h-full w-full">
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth custom-scrollbar" ref={scrollRef}>
                {props.isHistoryLoading || props.isIntegrityChecking ? (
                    <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-1000">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 blur-xl animate-pulse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80 animate-pulse">
                                {props.isIntegrityChecking ? "Verificando Snapshots" : t('waiting', 'assistant')}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-mono opacity-50 tracking-tighter">
                                Neural Link Established... 100%
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {props.history.map((msg, index) => (
                            <ChatMessageItem 
                                key={msg.refactor_history_id} 
                                msg={msg} 
                                index={index}
                                previousSnapshot={index > 0 ? props.history[index - 1].snapshot : undefined}
                                onEnvVarSave={props.onEnvVarSave} 
                                onRevert={props.onRevert} 
                                isLastModelMessage={msg.refactor_history_id === lastModelMessageId}
                            />
                        ))}
                        
                        {props.isProcessing && (
                            <ThinkingCard 
                                aiPlan={props.aiPlan}
                                thinkTime={props.thinkTime}
                                currentReasoning={props.currentReasoning}
                                currentText={props.currentText}
                                fileStatuses={props.fileStatuses}
                                statusOverride={props.statusOverride} // New prop
                            />
                        )}
                        
                        {props.history.length === 0 && !props.isProcessing && (
                            <div className="h-full flex items-center justify-center text-center p-8 animate-in fade-in duration-1000">
                                <p className="text-xs text-muted-foreground font-medium italic opacity-60">
                                    {t('noMessages', 'assistant')}
                                </p>
                            </div>
                        )}
                    </>
                )}
                <div className="h-4"></div>
            </div>
            
            <ChatContextTray 
                selectors={props.chatContextSelectors}
                selectedLogs={props.selectedLogs}
                onUse={props.onUseSelectorsInChat}
                onRemove={props.onRemoveSelector}
                onRemoveLog={props.onRemoveLog}
                onClear={props.onClearSelectors}
            />

            <ChatInputArea 
                chatInput={props.chatInput}
                setChatInput={props.setChatInput}
                isProcessing={props.isProcessing || props.isHistoryLoading || props.isIntegrityChecking} 
                isListening={props.isListening}
                toggleListening={props.toggleListening}
                onSend={() => props.onSend()}
                onStop={props.onStop}
                attachments={props.attachments}
                setAttachments={props.setAttachments}
                showSuggestions={props.history.length > 0}
                suggestions={props.suggestions || []}
                selectedModel={props.selectedModel}
                onModelChange={props.onModelChange}
                availableModels={props.availableModels}
                settings={props.settings}
                selectedProvider={props.selectedProvider}
                onProviderChange={props.onProviderChange}
            />
        </div>
    </div>
  );
};