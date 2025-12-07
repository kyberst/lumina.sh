
import { GoogleGenAI } from "@google/genai";
import { AppModule, ChatMessage, GeneratedFile, JournalEntry } from "../types";
import { logger } from "./logger";
import { generateAppCode as genApp } from "./ai/generator";
import { getSystemPrompt, PromptType } from "./promptService";
import { MemoryOrchestrator } from "./memory/index";
import { sqliteService } from "./sqliteService";

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
        const [basePrompt, protocol] = await Promise.all([
            getSystemPrompt(promptType),
            getSystemPrompt('protocol')
        ]);

        // --- Memory Integration Start ---
        const settingsJson = await sqliteService.getConfig('app_settings');
        let memoryContext = "";
        let memory: MemoryOrchestrator | null = null;
        
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            if (settings.memory?.enabled) {
                memory = new MemoryOrchestrator(settings);
                memoryContext = await memory.retrieveContext(userMessage);
            }
        }
        // --- Memory Integration End ---

        const langInst = lang === 'es' ? 'Respond in Spanish.' : 'Respond in English.';
        let sysPrompt = `${basePrompt}\n\n${protocol}\n\nLanguage: ${langInst}`;
        
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
            // We need to parse which files were modified from the response XML if possible, 
            // but for now we will just pass empty array or extract lazily. 
            // In a real scenario, we'd pass the parsed result from `useRefactorStream`.
            // Here we just save the interaction.
            memory.saveInteraction(
                { id: crypto.randomUUID(), role: 'user', text: userMessage, timestamp: Date.now() },
                fullResponse,
                [] // Modified files would need to be extracted from response
            ).catch(err => console.error("Memory save failed", err));
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
        
        const rawPrompt = await getSystemPrompt('dyad');
        const langInst = lang === 'es' ? 'Spanish' : 'English';
        const systemPrompt = rawPrompt.replace('{{CONTEXT}}', entriesContext.slice(0, 10000)) + `\nLanguage: ${langInst}`;

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
