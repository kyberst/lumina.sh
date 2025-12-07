import { GoogleGenAI } from "@google/genai";
import { ILLMProvider, GenerationOptions, StreamChunk } from "./interface";
import { ChatMessage } from "../../../types";

export class GeminiProvider implements ILLMProvider {
    id = 'gemini';
    private ai: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
        this.ai = new GoogleGenAI({ apiKey });
        // Map common names to actual model IDs based on guidelines
        if (model === 'flash') this.model = 'gemini-2.5-flash';
        else if (model === 'pro') this.model = 'gemini-3-pro-preview';
        else this.model = model;
    }

    private getThinkingBudget(level?: 'low' | 'medium' | 'high'): number | undefined {
        if (!level) return undefined;
        switch(level) {
            case 'high': return 16384;
            case 'medium': return 8192;
            case 'low': return 2048;
            default: return undefined;
        }
    }

    async generateContent(prompt: string, options?: GenerationOptions): Promise<string> {
        const config: any = {};
        if (options?.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options?.jsonMode) config.responseMimeType = "application/json";
        if (options?.schema) config.responseSchema = options.schema;
        if (options?.temperature) config.temperature = options.temperature;
        
        // Handle thinking budget if provided for generateContent (though typically mostly for reasoning tasks)
        const budget = this.getThinkingBudget(options?.thinkingBudget);
        if (budget) config.thinkingConfig = { thinkingBudget: budget };

        const res = await this.ai.models.generateContent({
            model: this.model,
            contents: { parts: [{ text: prompt }] },
            config
        });
        return res.text || '';
    }

    async *generateStream(prompt: string, history: ChatMessage[], options?: GenerationOptions): AsyncGenerator<StreamChunk, void, unknown> {
        const config: any = {};
        if (options?.systemInstruction) config.systemInstruction = options.systemInstruction;
        
        const budget = this.getThinkingBudget(options?.thinkingBudget);
        if (budget) config.thinkingConfig = { thinkingBudget: budget };
        
        config.temperature = options?.temperature ?? 0.2;

        // Map internal history to Gemini format
        const geminiHistory = history
            .filter(h => !h.isStreaming && h.text && h.text.trim().length > 0)
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

        const chat = this.ai.chats.create({
            model: this.model,
            config,
            history: geminiHistory
        });

        const result = await chat.sendMessageStream({ message: prompt });
        
        for await (const chunk of result) {
            yield {
                text: chunk.text,
                usage: chunk.usageMetadata ? {
                    inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                    outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
                } : undefined
            };
        }
    }
}