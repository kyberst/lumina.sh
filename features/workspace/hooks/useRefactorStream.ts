
import React, { useState, useRef } from 'react';
import { streamChatRefactor } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../../services/ai/streamParser';
import { getLanguage } from '../../../services/i18n';
import { ragService } from '../../../services/memory/ragService';
import { anchorService } from '../../../services/memory/anchorService';
import { PreferenceLearner } from '../../../services/ai/preferenceLearner';
import { ChatMessage, ConsoleLog } from '../../../types';

export const useRefactorStream = ({ entry, settings, history, setHistory, onTurnComplete, setIframeKey }: any) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState(createInitialStreamState(entry.files ?? []));
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Fix: Updated function signature to handle all 5 arguments passed from useWorkspaceLogic.
     * Incorporates editorContext and contextLogs into the prompt for enhanced AI awareness.
     */
    const handleStreamingBuild = async (
        userMessage?: string, 
        attachments: any[] = [], 
        editorContext?: any, 
        messageObj?: any, 
        contextLogs?: ConsoleLog[]
    ) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();

        let promptText = userMessage || entry.prompt;
        
        // Prepend contextual information to the prompt if provided
        if (editorContext?.selectedCode) {
            promptText = `[EDITOR CONTEXT] File: ${editorContext.activeFile}, Line: ${editorContext.cursorLine}\nSelected Code Snippet:\n${editorContext.selectedCode}\n\n[USER COMMAND]\n${promptText}`;
        }
        
        if (contextLogs && contextLogs.length > 0) {
            const logsStr = contextLogs.map(l => `[${l.type.toUpperCase()}] ${l.msg}${l.source ? ` (at ${l.source.file}:${l.source.line})` : ''}`).join('\n');
            promptText = `[RUNTIME CONSOLE CONTEXT]\n${logsStr}\n\n[USER COMMAND]\n${promptText}`;
        }

        const previousFiles = (entry.files ?? []).map(f => ({...f}));
        const controller = new AbortController();
        abortControllerRef.current = controller;
        
        setIsProcessing(true);
        let currentState: StreamState = createInitialStreamState(previousFiles);
        setStreamState(currentState);

        try {
            // RECUPERACIÓN DE ANCLAJES (IDENTITY)
            const anchors = await anchorService.getProjectContext(entry.projects_id);
            const ragContext = await ragService.retrieveContext(entry.projects_id, promptText);

            const stream = streamChatRefactor(previousFiles, promptText, history, getLanguage(), attachments, { 
                settings, ragContext, anchors, fsManifest: "" 
            }, controller.signal);

            for await (const chunk of stream) {
                if (controller.signal.aborted) break;
                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({ ...currentState });
                }
            }

            const finalState = finalizeStream(currentState);
            const modelMsg: ChatMessage = { 
                refactor_history_id: crypto.randomUUID(), 
                role: 'model', text: finalState.textBuffer, 
                reasoning: finalState.reasoningBuffer, timestamp: Date.now(), 
                snapshot: finalState.workingFiles 
            };
            
            setHistory((prev: any) => [...prev, modelMsg]);
            await onTurnComplete({ updatedEntry: { ...entry, files: finalState.workingFiles }, modelMessage: modelMsg });
            
            // CICLO DE APRENDIZAJE: Guardar nueva preferencia detectada
            PreferenceLearner.learnFromTurn(entry.projects_id, promptText, finalState.textBuffer);

        } catch (e: any) { console.error("Stream error", e); } 
        finally { setIsProcessing(false); }
    };

    return { isProcessing, streamState, handleStreamingBuild, cancelStream: () => abortControllerRef.current?.abort() };
};
