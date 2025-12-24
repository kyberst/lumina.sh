import React, { useState, useRef } from 'react';
import { streamChatRefactor } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream } from '../../../services/ai/streamParser';
import { getLanguage } from '../../../services/i18n';
import { ragService } from '../../../services/memory/ragService';
import { graphService } from '../../../services/memory/graphService';
import { generateFSManifest } from '../../../services/ai/utils/manifest';
import { ConsoleLog, AppModule } from '../../../types';
import { logger } from '../../../services/logger';

// Fast Path Detection for social interactions or simple queries
const SIMPLE_PROMPT_REGEX = /^(hola|hello|hi|hey|buenas|buenos\s+(dias|tardes|noches)|qué\s+tal|que\s+tal|cómo\s+estás|como\s+estas|gracias|thanks|ok|vale|perfecto)[\s\p{P}]*$/iu;

export const useRefactorStream = ({ entry, settings, history, setHistory, onTurnComplete, setIframeKey, setTotalUsage }: any) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState(createInitialStreamState(entry.files ?? []));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = [], editorContext?: any, optimisticMessage?: any, contextLogs?: ConsoleLog[]) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const isInitial = !userMessage && entry.pendingGeneration;
        let promptText = userMessage || entry.prompt;
        const previousFiles = (entry.files ?? []).map(f => ({...f}));
        
        // Check if this is a simple prompt to enable Fast Path
        const isSimplePrompt = SIMPLE_PROMPT_REGEX.test(promptText.trim()) && promptText.length < 60;

        if (contextLogs && contextLogs.length > 0) {
            const logContext = contextLogs.map(l => `[${l.type.toUpperCase()}] ${l.msg} (Source: ${l.source?.file}:${l.source?.line})`).join('\n');
            promptText = `${promptText}\n\n[CONTEXT: ACTIVE CONSOLE ERRORS]\nThe user has selected the following errors to fix:\n${logContext}`;
        }

        let currentHistory = history;
        if (optimisticMessage) {
            setHistory((prev: any[]) => prev.map(m => m.refactor_history_id === optimisticMessage.refactor_history_id ? { ...optimisticMessage, snapshot: previousFiles, pending: false } : m));
            currentHistory = [...history, { ...optimisticMessage, snapshot: previousFiles, pending: false }];
        }

        setIsProcessing(true);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Reset stream state and set initial status based on prompt complexity
        const initialStreamState = createInitialStreamState(previousFiles);
        setStreamState({ 
            ...initialStreamState, 
            statusOverride: isSimplePrompt ? (getLanguage() === 'es' ? 'Respondiendo...' : 'Responding...') : undefined 
        });

        try {
            let ragContext = { snippets: [], patterns: [] };

            // HEAVY PROCESSES: Only run if NOT a simple prompt
            if (!isSimplePrompt && entry.projects_id) {
                // 1. EMERGENCE LAYER: Extract entities from prompt (Async, non-blocking)
                graphService.extractEntitiesFromChat(entry.projects_id, promptText).catch(e => {});

                // 2. HYBRID RAG: Semantic Vectors + Relational Graph (Blocking)
                ragContext = await ragService.retrieveContext(entry.projects_id, promptText);
            }

            if (controller.signal.aborted) throw new Error("Aborted");

            // 3. SYNC CHECKSUM: Workspace Manifest (Only for code tasks)
            const fsManifest = isSimplePrompt ? "" : generateFSManifest(previousFiles);

            let effectiveHistory = history;
            if (isInitial && history.length > 0 && history[0].text === promptText) {
                effectiveHistory = [];
            }

            const stream = streamChatRefactor(previousFiles, promptText, effectiveHistory, getLanguage(), attachments, { 
                settings, systemPromptType: isInitial ? 'builder' : 'refactor', ragContext, fsManifest 
            }, controller.signal);

            let currentState = { ...initialStreamState };
            for await (const chunk of stream) {
                if (controller.signal.aborted) break;

                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({ ...currentState });
                }
            }

            if (controller.signal.aborted) throw new Error("Aborted");

            const finalState = finalizeStream(currentState);
            const modelMsg = { refactor_history_id: crypto.randomUUID(), role: 'model', text: finalState.textBuffer, reasoning: finalState.reasoningBuffer, timestamp: Date.now(), modifiedFiles: Object.keys(finalState.fileStatuses), snapshot: finalState.workingFiles };
            
            if (abortControllerRef.current === controller) {
                setHistory([...currentHistory, modelMsg]);
                await onTurnComplete({ updatedEntry: { ...entry, files: finalState.workingFiles, pendingGeneration: false }, modelMessage: modelMsg, oldFiles: previousFiles, newFiles: finalState.workingFiles });
                setIframeKey((k: number) => k + 1);
            }
        } catch (e: any) { 
            if (e.message !== 'Aborted' && e.name !== 'AbortError') {
                logger.error(AppModule.BUILDER, `AI response failed: ${e.message}`, e);
            }
        } finally { 
            if (abortControllerRef.current === controller) {
                setIsProcessing(false); 
            }
        }
    };

    const cancelStream = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsProcessing(false);
    };

    return { isProcessing, streamState, handleStreamingBuild, cancelStream };
};