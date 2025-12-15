
import React, { useState, useRef } from 'react';
import { JournalEntry, ChatMessage, AppSettings, EditorContext, DependencyDetails, AIAudit, GeneratedFile } from '../../../types';
import { streamChatRefactor, simplifyUserPrompt } from '../../../services/geminiService';
import { createInitialStreamState, parseStreamChunk, finalizeStream, StreamState } from '../../../services/ai/streamParser';
import { dbFacade } from '../../../services/dbFacade';
import { getLanguage, t } from '../../../services/i18n';
import { toast } from '../../../services/toastService';
import { dialogService } from '../../../../services/dialogService';
import { formattingService } from '../../../../services/formattingService';
import { findSimilarCode } from '../../../../services/memory/retrieval';
import { getEmbedding } from '../../../../services/memory/embedding';
import { extractComponentProps } from '../../../../services/ai/analysis';

interface UseRefactorStreamProps {
    entry: JournalEntry;
    settings: AppSettings;
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onUpdate: (e: JournalEntry) => void;
    setTotalUsage: React.Dispatch<React.SetStateAction<{input: number, output: number}>>;
    setIframeKey: React.Dispatch<React.SetStateAction<number>>;
    setIsOffline: (isOffline: boolean) => void;
}

const containsTechnicalJargon = (text: string): boolean => {
    // Regex for common html tags, attributes, CSS classes, or basic JS syntax
    const jargonRegex = /\b(div|span|p|h1|const|let|var|function|=>|className|style=|onClick)\b|<[a-z]+>|\w+-\w+/i;
    return jargonRegex.test(text);
};

export const useRefactorStream = ({ entry, settings, history, setHistory, onUpdate, setTotalUsage, setIframeKey, setIsOffline }: UseRefactorStreamProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamState, setStreamState] = useState<StreamState>(createInitialStreamState(entry.files));
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStreamingBuild = async (
        userMessage?: string, attachments: any[] = [], editorContext?: EditorContext, mode: 'modify' | 'explain' = 'modify',
        options?: { isRetry?: boolean; overrideSettings?: Partial<AppSettings>; isFollowUp?: boolean, bypassInterceptors?: boolean }
    ) => {
        setIsOffline(false); // Reset offline state on every new attempt
        const isInitial = !userMessage && entry.pendingGeneration;
        let originalPrompt = userMessage || entry.prompt;
        let promptText = originalPrompt;
        let simplifiedText: string | undefined = undefined;

        const userMsgForHistory: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: originalPrompt, timestamp: Date.now(), attachments, editorContext, simplifiedText, bypassInterceptors: options?.bypassInterceptors };
        
        if (!options?.isRetry && !isInitial && !options?.isFollowUp) {
            setHistory(p => [...p, userMsgForHistory]);
        }
        
        setIsProcessing(true);

        // --- INTELLIGENT INTERCEPTORS ---
        if (mode === 'modify' && !options?.bypassInterceptors && !isInitial) {
            // 1. Code Reuse Interceptor
            const similarCode = await findSimilarCode(promptText, getEmbedding);
            if (similarCode) {
                const suggestionMsg: ChatMessage = {
                    id: crypto.randomUUID(), role: 'model', isAwaitingInput: true, timestamp: Date.now(),
                    text: settings.developerMode 
                        ? t('reuseSuggestionDev', 'assistant').replace('{file}', similarCode.file).replace('{score}', (similarCode.score * 100).toFixed(0))
                        : t('reuseSuggestionUser', 'assistant').replace('{file}', similarCode.file),
                    suggestions: [
                        { label: t('reuseAction', 'assistant'), action: 'reuse', payload: { file: similarCode.file, originalPrompt } },
                        { label: t('createAction', 'assistant'), action: 'create_new', payload: { originalPrompt } }
                    ]
                };
                setHistory(p => [...p, suggestionMsg]);
                setIsProcessing(false);
                return;
            }

            // 2. Prop Suggestions Interceptor
            const componentMatch = promptText.match(/(?:add|use|insert|render)\s+(?:a|an|the)\s+<(\w+)/i);
            const componentName = componentMatch ? componentMatch[1] : null;
            if (componentName) {
                const componentFile = entry.files.find(f => f.name.includes(`${componentName}.tsx`));
                if (componentFile) {
                    const props = extractComponentProps(componentFile.content);
                    if (props.length > 0) {
                        const requiredProps = props.filter(p => !p.isOptional);
                        if (requiredProps.length > 0) {
                            const propMsg: ChatMessage = {
                                id: crypto.randomUUID(), role: 'model', isAwaitingInput: true, timestamp: Date.now(),
                                text: settings.developerMode
                                    ? t('propsNeededDev', 'assistant').replace('{component}', componentName)
                                    : t('propsNeededUser', 'assistant'),
                                propInputs: requiredProps
                            };
                            setHistory(p => [...p, propMsg]);
                            setIsProcessing(false);
                            return;
                        }
                    }
                }
            }
        }
        
        // --- Jargon Simplification Logic ---
        if (mode === 'modify' && !settings.developerMode && containsTechnicalJargon(promptText) && !options?.isFollowUp) {
            const toastId = toast.loading(t('simplifying', 'workspace'));
            try {
                simplifiedText = await simplifyUserPrompt(promptText, getLanguage());
                promptText = simplifiedText; // Use the simplified prompt for the AI
                // Update message in history with simplified text
                setHistory(p => p.map(m => m.id === userMsgForHistory.id ? { ...m, simplifiedText } : m));
                toast.dismiss(toastId);
                toast.success(t('simplified', 'workspace'));
            } catch (e) { toast.dismiss(toastId); }
        }
        
        if (editorContext) { /* ... (unchanged context injection) ... */ }
        
        const previousFiles = entry.files.map(f => ({...f}));

        setStreamState(createInitialStreamState(entry.files));
        abortControllerRef.current = new AbortController();

        let currentState = createInitialStreamState(entry.files);
        // ... (unchanged dependency normalization) ...

        let finalUsage = { inputTokens: 0, outputTokens: 0 };
        const effectiveSettings = { ...settings, ...(options?.overrideSettings || {}) };

        try {
            const promptType = isInitial ? 'builder' : (mode === 'explain' ? 'explain' : 'refactor');
            const stream = streamChatRefactor(entry.files, promptText, isInitial ? [] : history, getLanguage(), attachments, 
                { settings: effectiveSettings, systemPromptType: promptType }, 
                abortControllerRef.current.signal
            );

            for await (const chunk of stream) {
                if (chunk.usage) finalUsage = chunk.usage;
                if (chunk.text) {
                    currentState = parseStreamChunk(chunk.text, currentState);
                    setStreamState({...currentState});
                    if (currentState.patchError) {
                        abortControllerRef.current.abort(); // Signal stream to stop
                        break;
                    }
                }
            }
            
            currentState = finalizeStream(currentState);

            if (currentState.patchError) throw new Error("Patch failed");
            
            // --- Auto-Formatting Step ---
            const filesToFormat = [
                ...currentState.workingFiles.filter(f => !previousFiles.some(pf => pf.name === f.name)).map(f => f.name),
                ...Object.keys(currentState.patches)
            ];

            if (filesToFormat.length > 0) {
                const formattedFiles = await formattingService.formatFiles(currentState.workingFiles, filesToFormat);
                currentState.workingFiles = formattedFiles;
            }
            
            setStreamState({...currentState});
            
            const modelMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                text: currentState.textBuffer,
                reasoning: currentState.reasoningBuffer,
                timestamp: Date.now(),
                snapshot: currentState.workingFiles,
                modifiedFiles: filesToFormat,
                patches: currentState.patches,
                annotations: currentState.annotations,
                requiredEnvVars: currentState.requiredEnvVars,
                usage: finalUsage,
                isStreaming: false,
                applied: false,
                audit: {
                    tokenUsage: {
                        input: finalUsage.inputTokens,
                        output: finalUsage.outputTokens,
                    },
                    model: effectiveSettings.activeModelId || effectiveSettings.aiModel,
                    provider: effectiveSettings.activeProviderId || 'gemini',
                    thinkingBudget: effectiveSettings.thinkingBudget,
                    contextSize: effectiveSettings.contextSize
                }
            };

            setHistory(prev => {
                // Remove the last 'isAwaitingInput' message if it exists
                const filteredPrev = prev.filter(m => !m.isAwaitingInput);
                const updated = [...filteredPrev];

                const last = updated[updated.length-1];
                if (last?.role === 'user') updated.push(modelMsg);
                else if (last?.role === 'model') updated[updated.length-1] = modelMsg;
                else updated.push(modelMsg);
                return updated;
            });
            
            if (entry.pendingGeneration) {
                await onUpdate({ ...entry, pendingGeneration: false, description: currentState.textBuffer });
            }
            
        } catch (e: any) {
            if (e.message.includes("Patch failed") && currentState.patchError) {
                 const confirmed = await dialogService.confirm(
                    t('patchErrorTitle', 'builder'),
                    t('patchErrorDesc', 'builder').replace('{filename}', currentState.patchError.file),
                    { confirmText: t('patchRetryButton', 'builder') }
                );
                if (confirmed) {
                    handleStreamingBuild(userMessage, attachments, editorContext, mode, { isRetry: true, overrideSettings: { contextSize: 'max' } });
                } else {
                    setIsProcessing(false);
                }
            } else if (e.message !== 'Aborted') {
                toast.error(t('error.aiConnection', 'builder'));
                setIsOffline(true);
            }
        } finally {
            if (!currentState.patchError) {
                setIsProcessing(false);
            }
        }
    };
    
    const handleEnvVarSave = async (messageId: string, values: Record<string, string>) => {
        await onUpdate({ ...entry, envVars: { ...entry.envVars, ...values } });
        setHistory(prev => prev.map(m => m.id === messageId ? { ...m, envVarsSaved: true, isAwaitingInput: false } : m));
        await dbFacade.updateRefactorMessage(entry.id, history.find(m => m.id === messageId)!);
        const followUpPrompt = "The user has provided the required environment variables. Now, generate the code that uses them.";
        handleStreamingBuild(followUpPrompt, [], undefined, 'modify', { isFollowUp: true });
    };

    const cancelStream = () => abortControllerRef.current?.abort();

    return { isProcessing, streamState, handleStreamingBuild, cancelStream, handleEnvVarSave };
};
