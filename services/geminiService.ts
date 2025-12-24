
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GeneratedFile, AppSettings, SecurityReport } from '../types';
import { getRefactorSystemPrompt } from './ai/prompts/refactor';
import { generateFSManifest } from './ai/utils/manifest';
import { getSystemPrompt } from './promptService';

/**
 * Orchestrates streaming code generation with relational memory.
 */
export async function* streamChatRefactor(
    files: GeneratedFile[],
    prompt: string,
    history: ChatMessage[],
    lang: 'en' | 'es' | 'fr' | 'de',
    attachments: any[],
    options: { 
        settings: Partial<AppSettings>, 
        systemPromptType: string, 
        ragContext?: { snippets: string[], patterns: string[] },
        fsManifest?: string 
    },
    signal: AbortSignal
): AsyncGenerator<{ text: string, usage?: any }, void, unknown> {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = options.settings.aiModel === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // FAST PATH DETECTION: Check if prompt is a simple greeting
    const GREETING_REGEX = /^(hola|hello|hi|hey|buenas|buenos\s+(dias|tardes|noches)|qué\s+tal|que\s+tal|cómo\s+estás|como\s+estas)[\s\p{P}]*$/iu;
    const isGreeting = GREETING_REGEX.test(prompt.trim()) && prompt.length < 50;

    // Pass context size and autoApprove setting to system prompt generator
    const sys = getRefactorSystemPrompt(
        lang, 
        options.settings.contextSize || 'default', 
        options.settings.autoApprove ?? true
    );
    
    // Build Context
    let fileCtx = "";
    let manifest = "";
    let snippets = "";
    let patterns = "";

    if (!isGreeting) {
        snippets = options.ragContext?.snippets?.length 
            ? `\n[SEMANTIC_MEMORIES]:\n${options.ragContext.snippets.join('\n---\n')}\n` : '';
        patterns = options.ragContext?.patterns?.length 
            ? `\n[RELATIONAL_GRAPH_NODES]:\n${options.ragContext.patterns.join('\n')}\n` : '';

        manifest = options.fsManifest || generateFSManifest(files);
        fileCtx = files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n');
    } else {
        manifest = "[FAST_PATH_ACTIVE: Files omitted for conversation speed]";
        fileCtx = "[FILES_HIDDEN_FOR_GREETING]";
    }
    
    const finalPrompt = `${patterns}${snippets}\n${manifest}\n\nCURRENT_CODEBASE:\n${fileCtx}\n\nUSER_COMMAND: ${prompt}`;
    
    const geminiHistory = history.filter(h => h.text).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction: sys, temperature: isGreeting ? 0.7 : 0.1 }, 
        history: geminiHistory
    });

    try {
        const result = await chat.sendMessageStream({ message: finalPrompt });
        for await (const chunk of result) {
            if (signal.aborted) break;
            const c = chunk as GenerateContentResponse;
            yield { text: c.text, usage: c.usageMetadata };
        }
    } catch (e: any) {
        // Graceful handling of Quota Exceeded
        if (e.message?.includes('429') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
            yield { text: `\n\n> **⚠️ API Quota Exceeded (429)**\n> The AI model is currently overloaded or you have hit your rate limit. \n> \n> *Recommendation:* Wait a minute and try again, or switch to the **Gemini Flash** model in Settings.` };
        } else {
            throw e;
        }
    }
}

/**
 * Performs a security audit of the provided codebase using Gemini Pro.
 * Supports cancellation via AbortSignal.
 */
export async function analyzeSecurity(files: GeneratedFile[], userPrompt: string, signal?: AbortSignal): Promise<SecurityReport> {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fileCtx = files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n');
    const systemPrompt = await getSystemPrompt('security');
    
    const prompt = `Perform a comprehensive security audit.
    User context: ${userPrompt || "Standard audit requested."}
    
    CODEBASE:
    ${fileCtx}`;

    if (signal?.aborted) throw new Error("Scan Cancelled");

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json'
        }
    });

    if (signal?.aborted) throw new Error("Scan Cancelled");

    const text = response.text;
    if (!text) throw new Error("Empty response from Security Audit");

    try {
        return JSON.parse(text) as SecurityReport;
    } catch (e) {
        throw new Error("Failed to parse Security Report JSON");
    }
}
