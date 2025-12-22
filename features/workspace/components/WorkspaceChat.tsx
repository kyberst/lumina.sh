
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, AIPlan } from '../../../types';
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
  onUseSelectorsInChat: () => void;
  onRemoveSelector: (s: string) => void;
  onClearSelectors: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  availableModels: ModelOption[];
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [props.history, props.isProcessing, props.currentReasoning, props.currentText, props.aiPlan]);

  // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
  const lastModelMessageId = [...props.history].reverse().find(m => m.role === 'model' && m.modifiedFiles && m.modifiedFiles.length > 0)?.mid;

  return (
    <div className="flex flex-col border-r border-border bg-background/50 backdrop-blur-sm h-full w-full">
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Lista de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth custom-scrollbar" ref={scrollRef}>
                {props.history.map((msg, index) => (
                    <ChatMessageItem 
                        // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
                        key={msg.mid} 
                        msg={msg} 
                        index={index}
                        previousSnapshot={index > 0 ? props.history[index - 1].snapshot : undefined}
                        onEnvVarSave={props.onEnvVarSave} 
                        onRevert={props.onRevert} 
                        // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
                        isLastModelMessage={msg.mid === lastModelMessageId}
                    />
                ))}
                
                {props.isProcessing && (
                    <ThinkingCard 
                        aiPlan={props.aiPlan}
                        thinkTime={props.thinkTime}
                        currentReasoning={props.currentReasoning}
                        currentText={props.currentText}
                        fileStatuses={props.fileStatuses}
                    />
                )}
                
                {/* Spacer for bottom input */}
                <div className="h-4"></div>
            </div>
            
            <ChatContextTray 
                selectors={props.chatContextSelectors}
                onUse={props.onUseSelectorsInChat}
                onRemove={props.onRemoveSelector}
                onClear={props.onClearSelectors}
            />

            <ChatInputArea 
                chatInput={props.chatInput}
                setChatInput={props.setChatInput}
                isProcessing={props.isProcessing}
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
            />
        </div>
    </div>
  );
};
