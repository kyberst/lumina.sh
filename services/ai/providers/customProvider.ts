import { ILLMProvider, GenerationOptions, StreamChunk } from "./interface";
import { ChatMessage, AIProvider } from "../../../types";
import { dbFacade } from "../../dbFacade";

export class CustomProvider implements ILLMProvider {
    id: string;
    private provider: AIProvider;
    private model: string;

    constructor(provider: AIProvider, modelId?: string) {
        this.id = provider.id;
        this.provider = provider;
        this.model = modelId || (provider.models[0]?.id || 'default');
    }

    private async getApiKey(): Promise<string> {
        if (!this.provider.apiKeyConfigKey) return '';
        return (await dbFacade.getConfig(this.provider.apiKeyConfigKey)) || '';
    }

    async generateContent(prompt: string, options?: GenerationOptions): Promise<string> {
        const apiKey = await this.getApiKey();
        const url = `${this.provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
        
        const messages = [];
        if (options?.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
        messages.push({ role: 'user', content: prompt });

        const body: any = {
            model: this.model,
            messages,
            temperature: options?.temperature ?? 0.7
        };
        
        if (options?.jsonMode) body.response_format = { type: "json_object" };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`Provider Error: ${res.statusText}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }

    async *generateStream(prompt: string, history: ChatMessage[], options?: GenerationOptions): AsyncGenerator<StreamChunk, void, unknown> {
        const apiKey = await this.getApiKey();
        const url = `${this.provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
        
        const messages = [];
        if (options?.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
        
        history.forEach(h => {
             messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text });
        });
        messages.push({ role: 'user', content: prompt });

        const body: any = {
            model: this.model,
            messages,
            temperature: options?.temperature ?? 0.2,
            stream: true
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.includes('[DONE]')) return;
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices?.[0]?.delta?.content;
                        if (content) yield { text: content };
                    } catch (e) {
                        // Ignore parse errors for incomplete chunks
                    }
                }
            }
        }
    }
}