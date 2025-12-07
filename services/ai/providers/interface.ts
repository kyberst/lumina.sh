import { ChatMessage } from '../../../types';

export interface StreamChunk {
    text: string;
    usage?: { inputTokens: number; outputTokens: number; };
}

export interface GenerationOptions {
    thinkingBudget?: 'low' | 'medium' | 'high';
    systemInstruction?: string;
    jsonMode?: boolean;
    schema?: any;
    temperature?: number;
}

export interface ILLMProvider {
    id: string;
    generateContent(prompt: string, options?: GenerationOptions): Promise<string>;
    generateStream(prompt: string, history: ChatMessage[], options?: GenerationOptions): AsyncGenerator<StreamChunk, void, unknown>;
}