import { AIProvider, AppError, AppModule, ChatMessage } from '../types';
import { logger } from './logger';
import { sqliteService } from './sqliteService';

export const testAIConnection = async (provider: AIProvider, modelId: string, apiKey: string): Promise<boolean> => {
    try {
        const url = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: 'user', content: 'Test connection' }],
                max_tokens: 1
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
        }
        
        return true;
    } catch (e: any) {
        logger.error(AppModule.SETTINGS, 'AI Connection Test Failed', e);
        throw new AppError(e.message, 'AI_TEST_FAIL', AppModule.SETTINGS);
    }
};

export const callCustomLLM = async (
    provider: AIProvider,
    modelId: string,
    history: ChatMessage[],
    newMessage: string,
    systemInstruction?: string
): Promise<string> => {
    try {
        const apiKey = await sqliteService.getConfig(provider.apiKeyConfigKey);
        if (!apiKey) throw new AppError("API Key not found for provider", "NO_KEY", AppModule.INSIGHT);

        const url = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
        
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        
        // Map Dyad history to OpenAI format
        history.forEach(msg => {
            messages.push({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text
            });
        });
        
        messages.push({ role: 'user', content: newMessage });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelId,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Provider Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "...";

    } catch (e: any) {
        logger.error(AppModule.INSIGHT, 'Custom LLM Call Failed', e);
        throw e;
    }
};