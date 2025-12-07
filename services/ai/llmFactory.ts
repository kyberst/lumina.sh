import { AppSettings } from '../../types';
import { GeminiProvider } from './providers/geminiProvider';
import { CustomProvider } from './providers/customProvider';
import { ILLMProvider } from './providers/interface';

export class LLMFactory {
    static getProvider(settings: Partial<AppSettings>): ILLMProvider {
        const activeId = settings.activeProviderId;
        
        if (activeId && activeId !== 'gemini' && settings.customProviders) {
            const custom = settings.customProviders.find(p => p.id === activeId);
            if (custom) {
                return new CustomProvider(custom, settings.activeModelId);
            }
        }

        // Default to Gemini
        return new GeminiProvider(process.env.API_KEY || '', settings.aiModel || 'flash');
    }
}