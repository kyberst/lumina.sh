
import { AppSettings } from '../../types';
import { GeminiProvider } from './providers/geminiProvider';
import { CustomProvider } from './providers/customProvider';
import { ILLMProvider } from './providers/interface';

export class LLMFactory {
    static getProvider(settings: Partial<AppSettings>, overrideModelId?: string): ILLMProvider {
        const modelToUse = overrideModelId || settings.activeModelId || settings.aiModel || 'flash';
        
        // Check standard Gemini models first
        if (['flash', 'pro'].includes(modelToUse)) {
            return new GeminiProvider(process.env.API_KEY || '', modelToUse);
        }

        // Check custom providers
        if (settings.customProviders) {
            for (const provider of settings.customProviders) {
                if (provider.models.some(m => m.id === modelToUse)) {
                    return new CustomProvider(provider, modelToUse);
                }
            }
        }
        
        // Default fallback to Gemini flash if no specific provider found
        return new GeminiProvider(process.env.API_KEY || '', 'flash');
    }
}