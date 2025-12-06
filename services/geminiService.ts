
import { GoogleGenAI } from "@google/genai";
import { AppModule, ChatMessage, GeneratedFile, JournalEntry } from "../types";
import { logger } from "./logger";
import { generateAppCode as genApp } from "./ai/generator";
import { SYSTEM_PROTOCOL } from "./ai/protocol";

export const generateAppCode = genApp;

export interface StreamChunk {
    text: string;
    usage?: { inputTokens: number; outputTokens: number; };
}

/**
 * Streams chat response from Gemini, injecting file context and system protocol.
 */
export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: any[],
  options?: any,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    try {
        // Prepare context
        const fileContext = currentFiles.map(f => `<file name="${f.name}">\n${f.content}\n</file>`).join('\n\n');
        
        const sysPrompt = `
You are an expert Senior Software Engineer.
Goal: Update the application code based on the user's request.

${SYSTEM_PROTOCOL}

**Context Rules:**
- **Reasoning First**: Always start with <lumina-reasoning>.
- **Language**: Respond in ${lang === 'es' ? 'Spanish' : 'English'}.
- **Accuracy**: When patching, context lines must match exactly.

Current Codebase:
${fileContext}
`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const historyContent = history
            .filter(h => !h.isStreaming && h.text && h.text.trim().length > 0) 
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

        // Configure Thinking Budget
        let thinkingBudgetTokens: number | undefined = undefined;
        if (options?.thinkingBudget) {
            const map: Record<string, number> = { low: 2048, medium: 8192, high: 16384 };
            thinkingBudgetTokens = typeof options.thinkingBudget === 'number' 
                ? options.thinkingBudget 
                : map[options.thinkingBudget] || 4096;
        }

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { 
                systemInstruction: sysPrompt,
                temperature: 0.2, 
                thinkingConfig: thinkingBudgetTokens ? { thinkingBudget: thinkingBudgetTokens } : undefined
            },
            history: historyContent
        });

        // Prepare User Message with Attachments
        const parts: any[] = [{ text: userMessage }];
        if (attachments && attachments.length > 0) {
            attachments.forEach(att => {
                const base64Data = att.data.split(',')[1];
                parts.push({ inlineData: { mimeType: att.type, data: base64Data } });
            });
        }

        const stream = await chat.sendMessageStream({ message: parts });

        for await (const chunk of stream) {
            if (signal?.aborted) throw new Error("Aborted");
            
            yield {
                text: chunk.text,
                usage: chunk.usageMetadata ? {
                    inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                    outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
                } : undefined
            };
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
        
        // Prepare context from entries
        const entriesContext = entries.map(e => 
          `- Project: ${e.project || 'Untitled'}\n  Description: ${e.description || 'No description'}\n  Tags: ${e.tags.join(', ')}\n  Complexity: ${e.mood}`
        ).join('\n\n');

        const systemPrompt = `
You are 'Dyad Architect', an AI assistant for a software builder platform called Lumina Studio.
You have access to the user's project history.
Goal: Answer questions about their projects, identifying patterns, or providing technical advice.
Language: ${lang === 'es' ? 'Spanish' : 'English'}.

User's Projects:
${entriesContext.slice(0, 10000)}
`;

        const chatHistory = history
            .filter(h => h.role === 'user' || h.role === 'model')
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemPrompt,
            },
            history: chatHistory
        });

        const response = await chat.sendMessage({ message: msg });
        return response.text || "No response generated.";

    } catch (e: any) {
        logger.error(AppModule.INSIGHT, "Dyad Chat failed", e);
        return "I am currently unable to access the project archives. Please try again later.";
    }
};
