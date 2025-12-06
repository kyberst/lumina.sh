
import { useState, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, EditorContext } from '../../../types';
import { streamChatRefactor } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../../services/ai/streamParser';
import { sqliteService } from '../../../services/sqliteService';
import { getLanguage } from '../../../services/i18n';
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

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = [], editorContext?: EditorContext) => {
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
        if (entry.dependencies) currentState.dependencies = { ...entry.dependencies };
        let finalUsage = { inputTokens: 0, outputTokens: 0 };

        try {
            const stream = streamChatRefactor(
                entry.files, promptText, isInitial ? [] : history, getLanguage(), 
                attachments, { thinkingBudget: settings.thinkingBudget }, abortControllerRef.current.signal
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
            const finalFiles = currentState.workingFiles;
            const finalEntry = { 
                ...entry, files: finalFiles, dependencies: currentState.dependencies,
                pendingGeneration: false, tags: isInitial ? [...entry.tags, "Generated"] : entry.tags 
            };
            
            onUpdate(finalEntry);
            setTotalUsage(prev => ({ input: prev.input + finalUsage.inputTokens, output: prev.output + finalUsage.outputTokens }));
            
            const modelMsg: ChatMessage = { 
                id: crypto.randomUUID(), role: 'model', 
                text: currentState.textBuffer.trim() || (isInitial ? "App generated." : "Updates applied."), 
                reasoning: currentState.reasoningBuffer, timestamp: Date.now(),
                modifiedFiles: Object.keys(currentState.fileStatuses), usage: finalUsage,
                snapshot: finalFiles 
            };

            // 5. Save Model Message with DIFF (Passing T and T+1)
            await sqliteService.saveRefactorMessage(entry.id, modelMsg, previousFiles, finalFiles);
            
            if (!isInitial) await sqliteService.saveRefactorMessage(entry.id, msg);

            setHistory(p => isInitial ? [modelMsg] : [...p, modelMsg]);
            setIframeKey(k => k+1);

        } catch (e: any) {
            if (e.message !== 'Aborted') toast.error(e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelStream = () => abortControllerRef.current?.abort();

    return { isProcessing, streamState, handleStreamingBuild, cancelStream, setStreamState };
};
