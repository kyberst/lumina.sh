
import { AppModule, ChatMessage, GeneratedFile, JournalEntry, AppSettings } from "../types";
import { logger } from "./logger";
import { generateAppCode as genApp } from "./ai/generator";
import { getSystemPrompt, PromptType } from "./promptService";
import { MemoryOrchestrator } from "./memory/index";
import { dbFacade } from "./dbFacade";
import { getRefactorSystemPrompt } from "./ai/prompts/refactor";
import { LLMFactory } from "./ai/llmFactory";
import { StreamChunk } from "./ai/providers/interface";
import { toast } from "./toastService";
import { t } from "./i18n";

export const generateAppCode = genApp;

export { StreamChunk };

export const simplifyUserPrompt = async (prompt: string, lang: 'en' | 'es'): Promise<string> => {
    try {
        const langName = lang === 'es' ? 'Spanish' : 'English';
        let sysPrompt = await getSystemPrompt('simplify');
        sysPrompt = sysPrompt.replace(/{{LANG}}/g, langName);

        // Use a fast model for this simple task
        const provider = LLMFactory.getProvider({ aiModel: 'flash' });

        const simplified = await provider.generateContent(prompt, {
            systemInstruction: sysPrompt,
            temperature: 0.2 // Low temp for deterministic translation
        });
        
        // Return the simplified prompt, or the original if simplification fails/returns empty
        return simplified.trim() || prompt;
    } catch (e: any) {
        logger.warn(AppModule.BUILDER, "Prompt simplification failed, using original.", e);
        return prompt; // Fallback to original prompt on error
    }
};

export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: any[],
  options?: { thinkingBudget?: 'low' | 'medium' | 'high', systemPromptType?: PromptType, settings?: AppSettings },
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    
    // --- Settings and Prompt Preparation ---
    const settingsJson = await dbFacade.getConfig('app_settings');
    let currentSettings: Partial<AppSettings> = options?.settings || {};
    if (settingsJson) {
        currentSettings = { ...JSON.parse(settingsJson), ...currentSettings };
    }
    
    const fileContext = currentFiles.map(f => `<file name="${f.name}">\n${f.content}\n</file>`).join('\n\n');
    const promptType = options?.systemPromptType || 'refactor';
    const langName = lang === 'es' ? 'Spanish' : 'English';
    let sysPrompt = "";

    // Build the system prompt
    if (promptType === 'refactor') {
        sysPrompt = await getRefactorSystemPrompt(lang, currentSettings.contextSize || 'default');
    } else {
        const [basePrompt, protocol] = await Promise.all([ getSystemPrompt(promptType), getSystemPrompt('protocol') ]);
        sysPrompt = `${basePrompt.replace(/{{LANG}}/g, langName)}\n\n${protocol}`;
    }

    if (currentSettings.systemContextOverride) {
        sysPrompt += `\n\n**PROJECT-SPECIFIC ARCHITECTURE CONTEXT (OVERRIDE):**\n${currentSettings.systemContextOverride}`;
    }

    if (sysPrompt.includes('{{FILE_CONTEXT}}')) sysPrompt = sysPrompt.replace('{{FILE_CONTEXT}}', fileContext);
    else if (promptType === 'refactor') sysPrompt += `\n\nCurrent Codebase:\n${fileContext}`;

    if (currentSettings.learningMode) {
        sysPrompt += `\n\n**LEARNING MODE ACTIVE:**\nYour primary goal is to teach the user. In every new or modified line of code, you MUST add a detailed, didactic comment explaining the purpose and logic of that line. Use the format \`// LUMINA_NOTE: [Your explanation]\` for single-line comments or a block comment for multi-line explanations. Explain concepts as you would to a junior developer. Ensure comments are in the target language: ${langName}.`;
    }

    // --- Model Failover Logic ---
    const modelPriority = currentSettings.modelPriority && currentSettings.modelPriority.length > 0 
        ? currentSettings.modelPriority 
        : [currentSettings.activeModelId || currentSettings.aiModel || 'flash'];

    for (let i = 0; i < modelPriority.length; i++) {
        const modelId = modelPriority[i];
        
        try {
            const provider = LLMFactory.getProvider(currentSettings, modelId);
            const stream = provider.generateStream(userMessage, history, {
                systemInstruction: sysPrompt,
                thinkingBudget: options?.thinkingBudget
            });

            for await (const chunk of stream) {
                if (signal?.aborted) throw new Error("Aborted");
                yield chunk;
            }

            // If we successfully complete the stream, we're done. Exit the function.
            // Memory orchestration and other post-processing will happen in the calling hook.
            return; 

        } catch (e: any) {
            logger.error(AppModule.BUILDER, `Stream failed for model ${modelId}`, e);

            // If this is the last model in the priority list, re-throw the error to be handled upstream.
            if (i === modelPriority.length - 1) {
                throw e;
            } else {
                // Otherwise, notify the user and continue to the next model.
                const nextModelId = modelPriority[i + 1];
                toast.info(t('failoverToast', 'workspace').replace('{modelA}', modelId).replace('{modelB}', nextModelId));
            }
        }
    }
}


export const analyzeSecurity = async (files: GeneratedFile[], prompt: string): Promise<string> => {
    // Basic Security analysis
    const provider = LLMFactory.getProvider({ aiModel: 'flash' });
    const text = await provider.generateContent(`Analyze:\n${files.map(f => f.content).join('\n')}\nRequest: ${prompt}`);
    return text || "No issues.";
};

export const chatWithDyad = async (history: ChatMessage[], msg: string, entries: JournalEntry[], lang: 'en' | 'es'): Promise<string> => {
    try {
        const entriesContext = entries.map(e => 
          `- Project: ${e.project || 'Untitled'}\n  Description: ${e.description || 'No description'}\n  Tags: ${e.tags.join(', ')}\n  Complexity: ${e.mood}`
        ).join('\n\n');
        
        // --- Memory Integration for Dyad ---
        let memoryContext = "";
        
        // 1. Try to load from Cache first (Latency Optimization)
        const cached = dbFacade.sessions.getCachedDyadContext();
        
        const isFollowUp = msg.length < 80 || /^(yes|no|ok|sure|and|but|then|now|make|change|translate|in|en|es|what|how)/i.test(msg);
        let settingsJson = await dbFacade.getConfig('app_settings');
        let settings: AppSettings = settingsJson ? JSON.parse(settingsJson) : {};

        if (isFollowUp && cached) {
            memoryContext = cached;
        } else {
            // 2. If not cached or complex query, retrieve from SurrealDB (WASM)
            if (settings.memory?.enabled) {
                const memory = new MemoryOrchestrator(settings);
                memoryContext = await memory.retrieveContext(msg);
                
                // 3. Update Cache with new context
                if (memoryContext) dbFacade.sessions.setCachedDyadContext(memoryContext);
            }
        }
        // -----------------------------------

        const rawPrompt = await getSystemPrompt('dyad');
        const langInst = lang === 'es' ? 'Spanish' : 'English';
        
        let systemPrompt = rawPrompt.replace('{{CONTEXT}}', entriesContext.slice(0, 10000));
        
        if (memoryContext) {
            systemPrompt += `\n\n[Memory Context]:\n${memoryContext}`;
        }
        
        systemPrompt += `\nLanguage: ${langInst}`;

        // Use Factory with current settings
        const provider = LLMFactory.getProvider(settings);

        const response = await provider.generateContent(msg, { systemInstruction: systemPrompt });
        return response || "No response generated.";

    } catch (e: any) {
        logger.error(AppModule.INSIGHT, "Dyad Chat failed", e);
        return "Unable to access project archives.";
    }
};