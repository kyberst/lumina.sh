import { useState, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings } from '../../../types';
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

export const useRefactorStream = ({ entry, settings, history, setHistory, onUpdate, setTotalUsage, setIframeKey }: UseRefactorStreamProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = []) => {
        const isInitial = !userMessage && entry.pendingGeneration;
        const promptText = userMessage || entry.prompt;
        
        const msg: ChatMessage = { 
            id: crypto.randomUUID(), role: 'user', text: promptText, timestamp: Date.now(), attachments 
        };

        if (!isInitial) {
            setHistory(p => [...p, msg]);
        }
        
        setIsProcessing(true);
        setStreamState(createInitialStreamState(entry.files));
        
        abortControllerRef.current = new AbortController();
        let currentState = createInitialStreamState(entry.files);
        if (entry.dependencies) currentState.dependencies = { ...entry.dependencies };

        let finalUsage = { inputTokens: 0, outputTokens: 0 };

        try {
            const stream = streamChatRefactor(
                entry.files, 
                promptText, 
                isInitial ? [] : history, 
                getLanguage(), 
                attachments, 
                { thinkingBudget: settings.thinkingBudget }, 
                abortControllerRef.current.signal
            );

            for await (const chunk of stream) {
                if (chunk.usage) finalUsage = chunk.usage;
                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({...currentState});
                }
            }
            
            currentState = finalizeStream(currentState);
            setStreamState({...currentState});

            const finalEntry = { 
                ...entry, 
                files: currentState.workingFiles, 
                dependencies: currentState.dependencies,
                pendingGeneration: false,
                tags: isInitial ? [...entry.tags, "Generated"] : entry.tags 
            };
            
            onUpdate(finalEntry);
            
            setTotalUsage(prev => ({
                input: prev.input + finalUsage.inputTokens,
                output: prev.output + finalUsage.outputTokens
            }));
            
            const modelMsg: ChatMessage = { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: currentState.textBuffer.trim() || (isInitial ? "App generated." : "Updates applied."), 
                reasoning: currentState.reasoningBuffer,
                timestamp: Date.now(),
                modifiedFiles: Object.keys(currentState.fileStatuses),
                usage: finalUsage
            };

            await sqliteService.saveRefactorMessage(entry.id, modelMsg);
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
