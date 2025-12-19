
import React, { useState, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, EditorContext, DependencyDetails, GeneratedFile } from '../../../types';
import { streamChatRefactor, generateSuggestions } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../../services/ai/streamParser';
import { getLanguage, t } from '../../../services/i18n';
import { toast } from '../../../services/toastService';

interface UseRefactorStreamProps {
    entry: JournalEntry;
    settings: AppSettings;
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onTurnComplete: (data: {
        updatedEntry: JournalEntry;
        userMessage: ChatMessage;
        modelMessage: ChatMessage;
        oldFiles: GeneratedFile[];
        newFiles: GeneratedFile[];
    }) => Promise<void>;
    setTotalUsage: React.Dispatch<React.SetStateAction<{input: number, output: number}>>;
    setIframeKey: React.Dispatch<React.SetStateAction<number>>;
}

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi'];
const COMMON_STACKS = [
    'React', 'Vue', 'Svelte', 'Angular', 
    'TypeScript', 'JavaScript', 'Python', 'Node.js', 
    'Tailwind', 'Bootstrap', 'Sass', 'HTML/CSS',
    'SQL', 'MongoDB', 'Firebase', 'Next.js', 'Supabase'
];

/** Hook to handle the AI streaming build process and state management */
export const useRefactorStream = ({ entry, settings, history, setHistory, onTurnComplete, setTotalUsage, setIframeKey }: UseRefactorStreamProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files ?? []));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = [], editorContext?: EditorContext) => {
        const isInitial = !userMessage && entry.pendingGeneration;
        let promptText = userMessage || entry.prompt;
        
        if (isInitial && entry.tags) {
            const requirements = [];
            const appLanguages = entry.tags.filter(tag => LANGUAGES_LIST.includes(tag));
            const stack = entry.tags.filter(tag => COMMON_STACKS.includes(tag) && !appLanguages.includes(tag));

            // Default Stack Logic: If no stack selected, enforce React + Supabase
            if (stack.length === 0) {
                requirements.push(`Tech Stack Default: Use **React** for Frontend and **Supabase** for Backend (Database/Auth).`);
            } else {
                requirements.push(`Tech Stack: The application MUST be built using this specific stack: ${stack.join(', ')}.`);
            }

            // Multi-Language Logic
            if (appLanguages.length > 0) {
                requirements.push(`Internationalization (i18n): The application content MUST be available in these languages: ${appLanguages.join(', ')}. Set up a JSON-based translation system or variable mapping.`);
            }
            
            // Intent Detection Instruction
            const intentInstruction = `
**CRITICAL INSTRUCTION - INTENT DETECTION:**
1. **GREETING/CHAT:** If the user input is just a greeting (e.g., "Hello", "Hola", "Hi") or a general question unrelated to building an app, **DO NOT BUILD THE APP**. Respond conversationally as a helpful architect. Do NOT use <lumina-file> tags.
2. **BUILD REQUEST:** Only if the user describes an app or asks to create something, proceed with the Technical Implementation below using the Protocol.
`;
            
            promptText = `${intentInstruction}\n\nUser Input: "${promptText}"\n\n**Technical Requirements (If Building):**\n- ${requirements.join('\n- ')}`;
        }

        if (isInitial) {
            console.log('[Lumina AI] 🚀 Sending INITIAL project generation message to AI:', promptText);
        } else {
            console.log('[Lumina AI] 💬 Sending follow-up message to AI:', promptText);
        }

        const previousFiles = (entry.files ?? []).map(f => ({...f}));

        const userTurnMessage: ChatMessage = { 
            id: crypto.randomUUID(), role: 'user', text: userMessage || entry.prompt, timestamp: Date.now(), 
            attachments, editorContext,
            // Snapshot IS required for Revert functionality to work immediately on this new message
            snapshot: previousFiles
        };

        const currentHistory = [...history, userTurnMessage];
        setHistory(currentHistory);
        
        setIsProcessing(true);
        setStreamState({
            ...createInitialStreamState(entry.files ?? []),
            reasoningBuffer: t('thinking.analyzing', 'journal'),
            aiPlan: { currentStep: 0, totalSteps: 1, currentTask: t('thinking.analyzing', 'journal') },
            suggestions: []
        });
        abortControllerRef.current = new AbortController();

        let currentState = createInitialStreamState(previousFiles);
        if (entry.dependencies) {
            const normalizedDeps: Record<string, DependencyDetails> = {};
            for (const [key, val] of Object.entries(entry.dependencies)) {
                normalizedDeps[key] = typeof val === 'string' ? { version: val, runtime: 'node' } : val;
            }
            currentState.dependencies = normalizedDeps;
        }

        let finalUsage = { inputTokens: 0, outputTokens: 0 };

        try {
            const promptType = isInitial ? 'builder' : 'refactor';
            let effectiveSettings = { ...settings };
            if (isInitial) {
                const model = entry.envVars?._INIT_MODEL as 'flash' | 'pro' | undefined;
                if (model) effectiveSettings.aiModel = model;
                const provider = entry.envVars?._INIT_PROVIDER;
                if (provider && provider !== 'gemini') effectiveSettings.activeProviderId = provider;
                else delete effectiveSettings.activeProviderId;
            }

            const stream = streamChatRefactor(
                previousFiles, promptText, history, getLanguage(), 
                attachments, { 
                    thinkingBudget: settings.thinkingBudget,
                    systemPromptType: promptType,
                    settings: effectiveSettings
                }, 
                abortControllerRef.current.signal
            );

            for await (const chunk of stream) {
                if (chunk.usage) finalUsage = chunk.usage;
                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({ ...currentState });
                }
            }

            let finalState = finalizeStream(currentState);
            
            const modelMessage: ChatMessage = {
                id: crypto.randomUUID(), role: 'model', text: finalState.textBuffer,
                reasoning: finalState.reasoningBuffer, timestamp: Date.now(),
                modifiedFiles: Object.keys(finalState.fileStatuses), 
                snapshot: finalState.workingFiles,
                usage: finalUsage, annotations: finalState.annotations, plan: finalState.aiPlan,
            };

            const updatedHistory = [...currentHistory, modelMessage];
            setHistory(updatedHistory);

            const updatedEntry: JournalEntry = {
                ...entry,
                files: finalState.workingFiles,
                description: finalState.textBuffer || entry.description,
                dependencies: finalState.dependencies,
                pendingGeneration: false,
            };
            
            await onTurnComplete({
                updatedEntry, userMessage: userTurnMessage, modelMessage,
                oldFiles: previousFiles, newFiles: finalState.workingFiles
            });
            
            setIframeKey(k => k + 1);

            // Fetch suggestions after the main response is complete
            const newSuggestions = await generateSuggestions(updatedHistory, getLanguage());
            finalState = { ...finalState, suggestions: newSuggestions };
            setStreamState(finalState);
            
        } catch (e: any) {
            if (e.name !== 'AbortError' && e.name !== 'Aborted') {
                toast.error(e.message);
                const errorMsg: ChatMessage = {
                    id: crypto.randomUUID(), role: 'model', text: `An error occurred: ${e.message}`, timestamp: Date.now(),
                };
                setHistory(p => [...p, errorMsg]);
            }
        } finally {
            setIsProcessing(false);
            setTotalUsage(p => ({ input: p.input + finalUsage.inputTokens, output: p.output + finalUsage.outputTokens }));
            abortControllerRef.current = null;
        }
    };
    
    const cancelStream = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsProcessing(false);
        }
    };

    return { isProcessing, streamState, handleStreamingBuild, cancelStream };
};
