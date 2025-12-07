
import { AppModule, ChatMessage, GeneratedFile, JournalEntry, AppSettings } from "../types";
import { logger } from "./logger";
import { generateAppCode as genApp } from "./ai/generator";
import { getSystemPrompt, PromptType } from "./promptService";
import { MemoryOrchestrator } from "./memory/index";
import { dbFacade } from "./dbFacade";
import { getRefactorSystemPrompt } from "./ai/prompts/refactor";
import { LLMFactory } from "./ai/llmFactory";
import { StreamChunk } from "./ai/providers/interface";

export const generateAppCode = genApp;

export { StreamChunk };

export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: any[],
  options?: { thinkingBudget?: 'low' | 'medium' | 'high', systemPromptType?: PromptType, settings?: AppSettings },
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    try {
        const fileContext = currentFiles.map(f => `<file name="${f.name}">\n${f.content}\n</file>`).join('\n\n');
        
        const promptType = options?.systemPromptType || 'refactor';

        // --- Memory Integration Start ---
        const settingsJson = await dbFacade.getConfig('app_settings');
        let memoryContext = "";
        let memory: MemoryOrchestrator | null = null;
        let contextSize = 'default';
        let currentSettings: Partial<AppSettings> = options?.settings || {};
        
        if (settingsJson) {
            const parsed = JSON.parse(settingsJson);
            currentSettings = { ...parsed, ...currentSettings };
            contextSize = parsed.contextSize || 'default';
            if (parsed.memory?.enabled) {
                memory = new MemoryOrchestrator(parsed);
                // Retrieve semantic context for the refactor task
                memoryContext = await memory.retrieveContext(userMessage);
            }
        }
        // --- Memory Integration End ---

        let sysPrompt = "";
        const langName = lang === 'es' ? 'Spanish' : 'English';

        if (promptType === 'refactor') {
            sysPrompt = getRefactorSystemPrompt(lang, contextSize);
        } else {
            const [basePrompt, protocol] = await Promise.all([
                getSystemPrompt(promptType),
                getSystemPrompt('protocol')
            ]);
            
            // Language Enforcement Logic
            let processedPrompt = basePrompt.replace(/{{LANG}}/g, langName);
            
            // Append explicit instruction if not present
            if (!processedPrompt.includes('IDIOMA_ACTUAL')) {
                processedPrompt += `\n\nIDIOMA_ACTUAL: ${langName}.\nGenera todas las respuestas de razonamiento y texto en el IDIOMA_ACTUAL.`;
            }

            sysPrompt = `${processedPrompt}\n\n${protocol}`;
        }
        
        if (memoryContext) {
            sysPrompt += `\n\n${memoryContext}`;
        }

        if (sysPrompt.includes('{{FILE_CONTEXT}}')) {
            sysPrompt = sysPrompt.replace('{{FILE_CONTEXT}}', fileContext);
        } else if (promptType === 'refactor') {
            sysPrompt += `\n\nCurrent Codebase:\n${fileContext}`;
        }

        // Use Factory to get the correct provider (Gemini, OpenAI, etc.)
        const provider = LLMFactory.getProvider(currentSettings);
        
        let promptWithAttachments = userMessage;
        // Basic attachment handling for non-multimodal providers
        // Real implementation would handle parts/attachments more robustly in the interface if provider supports it
        if (attachments && attachments.length > 0) {
             promptWithAttachments += `\n\n[Attached Images/Files: ${attachments.length} provided]`;
        }

        const stream = provider.generateStream(promptWithAttachments, history, {
            systemInstruction: sysPrompt,
            thinkingBudget: options?.thinkingBudget
        });

        let fullResponse = "";

        for await (const chunk of stream) {
            if (signal?.aborted) throw new Error("Aborted");
            if (chunk.text) fullResponse += chunk.text;
            
            yield chunk;
        }

        // Async save to memory (fire and forget)
        if (memory) {
            // Extract modified files from response to link in graph
            const modifiedFiles: string[] = [];
            const regex = /<lumina-(?:file|patch)\s+name=["']([^"']+)["']/g;
            let match;
            while ((match = regex.exec(fullResponse)) !== null) {
                if (match[1]) modifiedFiles.push(match[1]);
            }

            Promise.all([
                memory.saveInteraction(
                    { id: crypto.randomUUID(), role: 'user', text: userMessage, timestamp: Date.now() },
                    fullResponse,
                    modifiedFiles
                ),
                // Sync the codebase graph with the input files (best effort to keep graph updated)
                memory.syncCodebase(currentFiles)
            ]).catch(err => console.error("Memory sync failed", err));
        }

    } catch (e: any) {
        logger.error(AppModule.BUILDER, "Stream failed", e);
        throw e;
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
