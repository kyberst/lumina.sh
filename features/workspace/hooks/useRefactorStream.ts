
import React, { useState, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, EditorContext, DependencyDetails } from '../../../types';
import { streamChatRefactor } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../../services/ai/streamParser';
import { dbFacade } from '../../../services/dbFacade';
import { getLanguage, t } from '../../../services/i18n';
import { toast } from '../../../services/toastService';

interface UseRefactorStreamProps {
    entry: JournalEntry;
    settings: AppSettings;
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onUpdate: (e: JournalEntry) => void;
    setTotalUsage: React.Dispatch<React.SetStateAction<{input: number, output: number}>>;
    setIframeKey: React.Dispatch<React.SetStateAction<number>>;
}

/** Hook to handle the AI streaming build process and state management */
export const useRefactorStream = ({ entry, settings, history, setHistory, onUpdate, setTotalUsage, setIframeKey }: UseRefactorStreamProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = [], editorContext?: EditorContext, mode: 'modify' | 'explain' = 'modify') => {
        const isInitial = !userMessage && entry.pendingGeneration;
        let promptText = userMessage || entry.prompt;
        
        // 1. Inject Editor Context (Cursor/Selection) into prompt
        if (editorContext) {
            promptText += `\n\n<EDITOR_CONTEXT>\nActive File: ${editorContext.activeFile}\nLine: ${editorContext.cursorLine}`;
            if (editorContext.selectedCode) {
                promptText += `\nSelected Code:\n${editorContext.selectedCode}`;
            }
            promptText += `\n</EDITOR_CONTEXT>`;
        }
        
        // 2. Capture Previous State (Time T) for Diff Calculation
        const previousFiles = entry.files.map(f => ({...f}));

        const msg: ChatMessage = { 
            id: crypto.randomUUID(), role: 'user', text: promptText, timestamp: Date.now(), 
            attachments, editorContext 
        };

        if (!isInitial) setHistory(p => [...p, msg]);
        
        setIsProcessing(true);
        setStreamState(createInitialStreamState(entry.files));
        abortControllerRef.current = new AbortController();

        let currentState = createInitialStreamState(entry.files);
        // Normalize dependencies to ensure they match StreamState's strict DependencyDetails type
        if (entry.dependencies) {
            const normalizedDeps: Record<string, DependencyDetails> = {};
            for (const [key, val] of Object.entries(entry.dependencies)) {
                normalizedDeps[key] = typeof val === 'string' ? { version: val, runtime: 'node' } : val;
            }
            currentState.dependencies = normalizedDeps;
        }

        let finalUsage = { inputTokens: 0, outputTokens: 0 };

        try {
            // Determine system prompt based on mode
            const promptType = isInitial ? 'builder' : (mode === 'explain' ? 'explain' : 'refactor');

            const stream = streamChatRefactor(
                entry.files, promptText, isInitial ? [] : history, getLanguage(), 
                attachments, { 
                    thinkingBudget: settings.thinkingBudget,
                    systemPromptType: promptType,
                    settings: settings // Pass full settings to use correct AI provider
                }, 
                abortControllerRef.current.signal
            );

            // 3. Process Stream
            for await (const chunk of stream) {
                if (chunk.usage) finalUsage = chunk.usage;
                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({...currentState});
                }
            }
            
            currentState = finalizeStream(currentState);
            setStreamState({...currentState});

            // 4. Update Application State (Time T+1)
            // Only update files if NOT in explain mode
            const finalFiles = mode === 'explain' ? previousFiles : currentState.workingFiles;
            
            const finalEntry = { 
                ...entry, files: finalFiles, dependencies: currentState.dependencies,
                pendingGeneration: false, tags: isInitial ? [...entry.tags, "Generated"] : entry.tags 
            };
            
            const modelMsg: ChatMessage = { 
                id: crypto.randomUUID(), role: 'model', 
                text: currentState.textBuffer.trim() || (isInitial ? "App generated." : (mode === 'explain' ? "" : "Updates applied.")), 
                reasoning: currentState.reasoningBuffer, timestamp: Date.now(),
                modifiedFiles: mode === 'explain' ? [] : Object.keys(currentState.fileStatuses), 
                usage: finalUsage,
                snapshot: finalFiles,
                plan: currentState.aiPlan,
                contextSize: settings.contextSize
            };

            // 5. ATOMIC UPDATE: Save Project State + Refactor History (Diffs) + User Message in one Transaction
            await dbFacade.atomicUpdateProjectWithHistory(
                finalEntry, 
                modelMsg, 
                previousFiles, 
                finalFiles,
                !isInitial ? msg : undefined
            );
            
            // Update React State (UI)
            if (mode !== 'explain') {
                onUpdate(finalEntry);
            }
            setTotalUsage(prev => ({ input: prev.input + finalUsage.inputTokens, output: prev.output + finalUsage.outputTokens }));

            setHistory(p => isInitial ? [modelMsg] : [...p, modelMsg]);
            
            // Only refresh preview if files changed
            if (mode !== 'explain') {
                setIframeKey(k => k+1);
            }

        } catch (e: any) {
            if (e.message !== 'Aborted') {
                let msg = e.message;
                if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
                    msg = t('error.aiConnection', 'builder');
                }
                toast.error(msg);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelStream = () => abortControllerRef.current?.abort();

    return { isProcessing, streamState, handleStreamingBuild, cancelStream, setStreamState };
};
