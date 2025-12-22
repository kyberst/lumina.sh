
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
    setIframeKey: React.Dispatch<React.SetStateAction<number>>;
    // FIX: Add setTotalUsage to the interface to resolve TypeScript error in WorkspaceView
    setTotalUsage?: React.Dispatch<React.SetStateAction<{ input: number, output: number }>>;
}

const LANGUAGES_LIST = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Arabic', 'Hindi'];
const COMMON_STACKS = [
    'React', 'Vue', 'Svelte', 'Angular', 
    'TypeScript', 'JavaScript', 'Python', 'Node.js', 
    'Tailwind', 'Bootstrap', 'Sass', 'HTML/CSS',
    'SQL', 'MongoDB', 'Firebase', 'Next.js', 'Supabase'
];

const cleanErrorMessage = (error: any): string => {
    let msg = String(error?.message || error || "Unknown AI error");
    
    if (msg.includes('{') && msg.includes('}')) {
        try {
            const match = msg.match(/(\{.*\})/);
            if (match) {
                const parsed = JSON.parse(match[1]);
                if (parsed.error && parsed.error.message) {
                    msg = String(parsed.error.message);
                }
            }
        } catch (e) {}
    }

    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return "⚠️ Limit Exceeded: The AI provider rejected the request due to rate limits or billing quotas. Please try again later or check your API plan.";
    }
    if (msg.includes("SAFETY")) {
        return "🛡️ Safety Block: The AI refused to generate this content due to safety settings.";
    }

    return msg;
};

// FIX: Added setTotalUsage to the hook parameters
export const useRefactorStream = ({ entry, settings, history, setHistory, onTurnComplete, setIframeKey, setTotalUsage }: UseRefactorStreamProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files ?? []));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (userMessage?: string, attachments: any[] = [], editorContext?: EditorContext, optimisticMessage?: ChatMessage) => {
        const isInitial = !userMessage && entry.pendingGeneration;
        let promptText = userMessage || entry.prompt;
        
        if (isInitial && entry.tags) {
            const requirements = [];
            const appLanguages = entry.tags.filter(tag => LANGUAGES_LIST.includes(tag));
            const stack = entry.tags.filter(tag => COMMON_STACKS.includes(tag) && !appLanguages.includes(tag));

            if (stack.length === 0) {
                requirements.push(`Tech Stack Default: Use **React** for Frontend and **Supabase** for Backend (Database/Auth).`);
            } else {
                requirements.push(`Tech Stack: The application MUST be built using this specific stack: ${stack.join(', ')}.`);
            }

            if (appLanguages.length > 0) {
                requirements.push(`Internationalization (i18n): The application content MUST be available in these languages: ${appLanguages.join(', ')}. Set up a JSON-based translation system or variable mapping.`);
            }
            
            const intentInstruction = `
**CRITICAL INSTRUCTION - INTENT DETECTION:**
1. **GREETING/CHAT:** If the user input is just a greeting (e.g., "Hello", "Hola", "Hi") or a general question unrelated to building an app, **DO NOT BUILD THE APP**. Respond conversationally as a helpful architect. Do NOT use <lumina-file> tags.
2. **BUILD REQUEST:** Only if the user describes an app or asks to create something, proceed with the Technical Implementation below using the Protocol.
`;
            
            promptText = `${intentInstruction}\n\nUser Input: "${promptText}"\n\n**Technical Requirements (If Building):**\n- ${requirements.join('\n- ')}`;
        }

        const previousFiles = (entry.files ?? []).map(f => ({...f}));
        let currentHistory: ChatMessage[] = [];
        let userTurnMessage: ChatMessage;

        if (optimisticMessage) {
            userTurnMessage = { 
                ...optimisticMessage,
                snapshot: previousFiles,
                pending: false 
            };
            // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
            setHistory(prev => prev.map(m => m.mid === optimisticMessage.mid ? userTurnMessage : m));
            currentHistory = [...history, userTurnMessage];
        } else {
            userTurnMessage = { 
                // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
                mid: crypto.randomUUID(), role: 'user', text: userMessage || entry.prompt, timestamp: Date.now(), 
                attachments, editorContext,
                snapshot: previousFiles
            };
            currentHistory = [...history, userTurnMessage];
            setHistory(currentHistory);
        }
        
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
        let lastUiUpdate = 0;
        const UI_UPDATE_INTERVAL = 100;

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
                    const now = Date.now();
                    if (now - lastUiUpdate > UI_UPDATE_INTERVAL) {
                        setStreamState({ ...currentState });
                        lastUiUpdate = now;
                    }
                }
            }

            setStreamState({ ...currentState });
            let finalState = finalizeStream(currentState);

            // FIX: Update the total usage in the view if a setter was provided
            if (setTotalUsage && (finalUsage.inputTokens > 0 || finalUsage.outputTokens > 0)) {
                setTotalUsage(prev => ({
                    input: prev.input + finalUsage.inputTokens,
                    output: prev.output + finalUsage.outputTokens
                }));
            }
            
            const modelMessage: ChatMessage = {
                // FIX: Property 'id' does not exist on type 'ChatMessage', using 'mid'
                mid: crypto.randomUUID(), role: 'model', text: finalState.textBuffer,
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
            const newSuggestions = await generateSuggestions(updatedHistory, getLanguage());
            finalState = { ...finalState, suggestions: newSuggestions };
            setStreamState(finalState);
            
        } catch (e: any) {
            if (e.name !== 'AbortError' && e.name !== 'Aborted') {
                const friendlyMessage = cleanErrorMessage(e);
                toast.error("AI Error: " + (friendlyMessage.length > 60 ? "Check chat" : friendlyMessage));
            }
        } finally {
            setIsProcessing(false);
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
