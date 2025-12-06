
import { GoogleGenAI, Type } from "@google/genai";
import { AppError, AppModule, GeneratedFile, AIProvider, EnvVarRequest } from "../../types";
import { logger } from "../logger";
import { callCustomLLM } from "../llmService";

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
        const sysPrompt = `You are an AI App Builder. Generate a web app. Return JSON. Complexity: ${complexity}. Lang: ${lang}. Include a 'reasoning' field explaining your architectural choices.`;
        
        if (options?.activeProvider && options?.activeModelId && options.activeProvider.id !== 'gemini') {
            const json = await callCustomLLM(options.activeProvider, options.activeModelId, [], `Request: ${prompt}. Return JSON matching schema.`, sysPrompt);
            return JSON.parse(json.replace(/```json|```/g, '').trim());
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelId = modelPreference === 'pro' ? "gemini-3-pro-preview" : "gemini-2.5-flash";

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

        const res = await ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ text: prompt }] },
            config: { systemInstruction: sysPrompt, responseMimeType: "application/json", responseSchema: schema }
        });

        return JSON.parse(res.text || '{}') as AppGenerationResult;
    } catch (e: any) {
        logger.error(AppModule.BUILDER, "Gen failed", e);
        throw e;
    }
};
