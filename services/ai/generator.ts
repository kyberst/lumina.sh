
import { Type } from "@google/genai";
import { AppError, AppModule, GeneratedFile, AIProvider, EnvVarRequest } from "../../types";
import { logger } from "../logger";
import { LLMFactory } from "./llmFactory";

export interface AppGenerationResult {
  reasoning?: string;
  description: string;
  files: GeneratedFile[];
  tags: string[]; 
  complexityScore: number;
  requiredEnvVars?: EnvVarRequest[];
}

export const generateAppCode = async (
  prompt: string, 
  complexity: number, 
  lang: 'en' | 'es',
  modelPreference: 'flash' | 'pro' = 'flash',
  options?: { activeProvider?: AIProvider, activeModelId?: string, thinkingBudget?: 'low' | 'medium' | 'high' }
): Promise<AppGenerationResult> => {
    try {
        const langName = lang === 'es' ? 'Spanish' : 'English';
        const sysPrompt = `You are an AI App Builder. Generate a web app. Return JSON. Complexity: ${complexity}.
        
        IDIOMA_ACTUAL: ${langName}.
        
        Instructions:
        1. Generate a 'reasoning' field explaining your architectural choices in ${langName}.
        2. Generate a 'description' field in ${langName}.
        3. Ensure comments in code are in ${langName} if appropriate, or standard English for code.
        4. Do NOT output markdown code blocks for the JSON. Just return raw JSON.
        `;
        
        const settings: any = { 
            aiModel: modelPreference 
        };
        
        if (options?.activeProvider) {
            settings.activeProviderId = options.activeProvider.id;
            settings.customProviders = [options.activeProvider];
            settings.activeModelId = options.activeModelId;
        }

        const provider = LLMFactory.getProvider(settings);

        const schema = {
            type: Type.OBJECT,
            properties: {
                reasoning: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                complexityScore: { type: Type.NUMBER },
                files: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, content: { type: Type.STRING }, language: { type: Type.STRING } } } },
                requiredEnvVars: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING }, defaultValue: { type: Type.STRING } } } }
            }
        };

        const res = await provider.generateContent(prompt, { 
            systemInstruction: sysPrompt, 
            jsonMode: true, 
            // Only pass schema if provider is Gemini (or supports it similarly)
            // Custom providers might use response_format: json_object but not full schema validation
            schema: provider.id === 'gemini' ? schema : undefined,
            thinkingBudget: options?.thinkingBudget
        });

        // Clean up markdown code blocks if present (common in non-Gemini models)
        const cleanJson = res.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson) as AppGenerationResult;
    } catch (e: any) {
        logger.error(AppModule.BUILDER, "Gen failed", e);
        throw e;
    }
};
