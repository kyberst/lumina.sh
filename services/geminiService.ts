
import { GoogleGenAI } from "@google/genai";
import { AppModule, ChatMessage, GeneratedFile, JournalEntry } from "../types";
import { logger } from "./logger";
import { generateAppCode as genApp } from "./ai/generator";
import { getSystemPrompt, PromptType } from "./promptService";
import { MemoryOrchestrator } from "./memory/index";
import { dbFacade } from "./dbFacade";
import { getRefactorSystemPrompt } from "./ai/prompts/refactor";

export const generateAppCode = genApp;

export interface StreamChunk {
    text: string;
    usage?: { inputTokens: number; outputTokens: number; };
}

export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: any[],
  options?: { thinkingBudget?: 'low' | 'medium' | 'high', systemPromptType?: PromptType },
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
        
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            contextSize = settings.contextSize || 'default';
            if (settings.memory?.enabled) {
                memory = new MemoryOrchestrator(settings);
                // Retrieve semantic context for the refactor task
                memoryContext = await memory.retrieveContext(userMessage);
            }
        }
        // --- Memory Integration End ---

        let sysPrompt = "";

        if (promptType === 'refactor') {
            sysPrompt = getRefactorSystemPrompt(lang, contextSize);
        } else {
            const [basePrompt, protocol] = await Promise.all([
                getSystemPrompt(promptType),
                getSystemPrompt('protocol')
            ]);
            const langInst = lang === 'es' ? 'Respond in Spanish.' : 'Respond in English.';
            sysPrompt = `${basePrompt}\n\n${protocol}\n\nLanguage: ${langInst}`;
        }
        
        if (memoryContext) {
            sysPrompt += `\n\n${memoryContext}`;
        }

        if (sysPrompt.includes('{{FILE_CONTEXT}}')) {
            sysPrompt = sysPrompt.replace('{{FILE_CONTEXT}}', fileContext);
        } else if (promptType === 'refactor') {
            sysPrompt += `\n\nCurrent Codebase:\n${fileContext}`;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const historyContent = history
            .filter(h => !h.isStreaming && h.text && h.text.trim().length > 0) 
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

        const thinkingBudget = options?.thinkingBudget === 'high' ? 16384 : 
                               options?.thinkingBudget === 'medium' ? 8192 : 2048;

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { 
                systemInstruction: sysPrompt,
                temperature: 0.2, 
                thinkingConfig: { thinkingBudget }
            },
            history: historyContent
        });

        const parts: any[] = [{ text: userMessage }];
        if (attachments && attachments.length > 0) {
            attachments.forEach(att => {
                const base64Data = att.data.split(',')[1];
                parts.push({ inlineData: { mimeType: att.type, data: base64Data } });
            });
        }

        const stream = await chat.sendMessageStream({ message: parts });

        let fullResponse = "";

        for await (const chunk of stream) {
            if (signal?.aborted) throw new Error("Aborted");
            if (chunk.text) fullResponse += chunk.text;
            
            yield {
                text: chunk.text,
                usage: chunk.usageMetadata ? {
                    inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                    outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
                } : undefined
            };
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze:\n${files.map(f => f.content).join('\n')}\nRequest: ${prompt}`
    });
    return res.text || "No issues.";
};

export const chatWithDyad = async (history: ChatMessage[], msg: string, entries: JournalEntry[], lang: 'en' | 'es'): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const entriesContext = entries.map(e => 
          `- Project: ${e.project || 'Untitled'}\n  Description: ${e.description || 'No description'}\n  Tags: ${e.tags.join(', ')}\n  Complexity: ${e.mood}`
        ).join('\n\n');
        
        // --- Memory Integration for Dyad ---
        let memoryContext = "";
        
        // 1. Try to load from Cache first (Latency Optimization)
        const cached = dbFacade.sessions.getCachedDyadContext();
        
        // Heuristic: Use cache if it's a follow-up or simple confirmation
        // Expanded regex to catch more conversational flow
        const isFollowUp = msg.length < 80 || /^(yes|no|ok|sure|and|but|then|now|make|change|translate|in|en|es|what|how)/i.test(msg);
        
        if (isFollowUp && cached) {
            memoryContext = cached;
        } else {
            // 2. If not cached or complex query, retrieve from SurrealDB (WASM)
            const settingsJson = await dbFacade.getConfig('app_settings');
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                if (settings.memory?.enabled) {
                    const memory = new MemoryOrchestrator(settings);
                    memoryContext = await memory.retrieveContext(msg);
                    
                    // 3. Update Cache with new context
                    if (memoryContext) dbFacade.sessions.setCachedDyadContext(memoryContext);
                }
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

        const chatHistory = history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] }));

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { systemInstruction: systemPrompt },
            history: chatHistory
        });

        const response = await chat.sendMessage({ message: msg });
        return response.text || "No response generated.";

    } catch (e: any) {
        logger.error(AppModule.INSIGHT, "Dyad Chat failed", e);
        return "Unable to access project archives.";
    }
};
