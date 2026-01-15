import { GoogleGenAI } from "@google/genai";
import { ILLMProvider, GenerationOptions, StreamChunk } from "./interface";
import { ChatMessage } from "../../../types";

export class GeminiProvider implements ILLMProvider {
    id = 'gemini';
    private ai: GoogleGenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gemini-3-flash-preview') {
        if (!apiKey) {
            throw new Error("Google Gemini API key is missing. Please ensure the API_KEY environment variable is set.");
        }
        this.ai = new GoogleGenAI({ apiKey });
        
        // Comprehensive mapping for Gemini models
        const modelMap: Record<string, string> = {
            'flash': 'gemini-3-flash-preview',
            'pro': 'gemini-3-pro-preview',
            '2.5-pro': 'gemini-2.5-pro-preview',
            '2.5-flash': 'gemini-2.5-flash-preview',
            '2.5-lite': 'gemini-2.5-flash-lite-preview'
        };

        this.model = modelMap[model] || model;
    }

    private getThinkingBudget(level?: 'low' | 'medium' | 'high'): number | undefined {
        if (!level) return undefined;
        
        // Budgeting based on model family
        const is25 = this.model.includes('2.5');
        const maxBudget = is25 ? 24576 : 32768; // Flash 2.5 / Pro 3 limits

        switch(level) {
            case 'high': return maxBudget;
            case 'medium': return Math.floor(maxBudget / 2);
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
                text: chunk.text ?? "",
                usage: chunk.usageMetadata ? {
                    inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                    outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
                } : undefined
            };
        }
    }
}
