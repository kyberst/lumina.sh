import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AppModule, JournalEntry, ChatMessage, GeneratedFile, AppSettings } from '../types';
import { getDyadSystemPrompt } from './ai/prompts/dyad';
import { getRefactorSystemPrompt } from './ai/prompts/refactor';
import { SYSTEM_PROTOCOL } from './ai/prompts/protocol';
import { StreamChunk } from './ai/providers/interface';


// FIX: Implement analyzeSecurity to fix missing export error in features/workspace/WorkspaceView.tsx
export const analyzeSecurity = async (files: GeneratedFile[], customPrompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `You are a security expert. Analyze the following code files for vulnerabilities. 
    Provide a report in Markdown format. Focus on common issues like XSS, CSRF, SQL injection, insecure dependencies, and hardcoded secrets.
    Be concise and provide actionable recommendations.`;

    const fileContents = files.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n');
    const fullPrompt = `${customPrompt}\n\n${fileContents}`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro for better analysis
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text || "Could not perform security analysis.";
};

// FIX: Implement chatWithDyad to fix missing export error in features/insight/DyadChat.tsx
export const chatWithDyad = async (
    history: ChatMessage[],
    newMessage: string,
    entries: JournalEntry[],
    lang: 'en' | 'es'
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const projectContext = entries
        .map(e => `Project: ${e.project || 'Untitled'}\nPrompt: ${e.prompt}\nDescription: ${e.description}\nTags: ${(e.tags || []).join(', ')}`)
        .join('\n\n---\n\n');

    const systemInstruction = getDyadSystemPrompt(lang, projectContext);
    
    const geminiHistory = history
        .filter(h => h.text && h.text.trim().length > 0)
        .map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }));

    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction,
        },
        history: geminiHistory
    });

    const response = await chat.sendMessage({ message: newMessage });

    return response.text || "Sorry, I couldn't generate a response.";
};


// FIX: Implement streamChatRefactor to fix missing export error in features/workspace/hooks/useRefactorStream.ts
// Helper function to get builder prompt
const getBuilderSystemPrompt = (lang: 'en' | 'es') => {
    const langName = lang === 'es' ? 'Spanish' : 'English';
    return `You are an expert Senior Software Engineer.
IDIOMA_ACTUAL: ${langName}. Your reasoning and summary MUST be in ${langName}.

**PHASE 1: INTENT DETECTION**
- If the user says "Hello", "Hola", or asks a general question: Respond conversationally. DO NOT GENERATE CODE TAGS (<lumina-file>).
- If the user asks to build/create an app: Follow the protocol below.

${SYSTEM_PROTOCOL}
**Context Rules:**
- **Reasoning First**: Always start with <lumina-reasoning>.
- **Language**: You MUST generate ALL content inside <lumina-reasoning> and <lumina-summary> tags in ${langName} (IDIOMA_ACTUAL).
- **Atomicity**: Your generated code inside <lumina-file> must NOT exceed 200 lines. If it does, you MUST create a <lumina-plan> to split it into smaller, modular files.
`;
}

const getThinkingBudget = (level?: 'low' | 'medium' | 'high'): number | undefined => {
    if (!level) return undefined;
    switch(level) {
        case 'high': return 16384;
        case 'medium': return 8192;
        case 'low': return 2048;
        default: return undefined;
    }
}


export async function* streamChatRefactor(
    files: GeneratedFile[],
    prompt: string,
    history: ChatMessage[],
    lang: 'en' | 'es',
    attachments: any[],
    options: {
        thinkingBudget?: 'low' | 'medium' | 'high';
        systemPromptType: 'builder' | 'refactor';
        settings: Partial<AppSettings>;
    },
    signal: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let modelName = 'gemini-3-flash-preview';
    if (options.settings.aiModel === 'pro') {
        modelName = 'gemini-3-pro-preview';
    }

    let systemInstruction = '';
    switch (options.systemPromptType) {
        case 'builder':
            systemInstruction = getBuilderSystemPrompt(lang);
            break;
        case 'refactor':
            systemInstruction = getRefactorSystemPrompt(lang, options.settings.contextSize || 'default');
            break;
    }

    const fileContext = files.map(f => `--- FILE: ${f.name} ---\n${f.content}`).join('\n\n');
    const fullPrompt = `Here is the current state of the codebase:\n${fileContext}\n\n---\n\nUser Request: ${prompt}`;

    const messageParts: any[] = [{ text: fullPrompt }];

    if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
            if (attachment.data && attachment.type && attachment.data.includes(',')) {
                const base64Data = attachment.data.split(',')[1];
                if (base64Data) {
                    messageParts.push({
                        inlineData: {
                            mimeType: attachment.type,
                            data: base64Data
                        }
                    });
                }
            }
        }
    }

    const geminiHistory = history
        .filter(h => !h.isStreaming && h.text && h.text.trim().length > 0)
        .map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        }));

    const config: any = {
        systemInstruction,
        temperature: 0.2
    };

    const budget = getThinkingBudget(options?.thinkingBudget);
    if (budget) {
        config.thinkingConfig = { thinkingBudget: budget };
    }

    const chat = ai.chats.create({
        model: modelName,
        config,
        history: geminiHistory
    });

    const result = await chat.sendMessageStream({ message: messageParts });

    for await (const chunk of result) {
        if (signal.aborted) {
            break;
        }
        
        const c = chunk as GenerateContentResponse;
        yield {
            text: c.text,
            usage: c.usageMetadata ? {
                inputTokens: c.usageMetadata.promptTokenCount || 0,
                outputTokens: c.usageMetadata.candidatesTokenCount || 0
            } : undefined
        };
    }
}

export const generateSuggestions = async (history: ChatMessage[], lang: 'en' | 'es'): Promise<string[]> => {
    if (!process.env.API_KEY) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const langName = lang === 'es' ? 'Spanish' : 'English';
        const context = history.slice(-4).map(h => `${h.role}: ${h.text}`).join('\n');
        
        const prompt = `Based on this chat history, suggest the next 3 logical, short, and actionable steps for building this web app.
Chat History:
${context}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                systemInstruction: `You are a helpful assistant. Generate exactly 3 brief suggestions for a user building a web app. Respond in ${langName}. Your output MUST be a valid JSON array of strings.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const jsonStr = response.text.trim();
        const suggestions = JSON.parse(jsonStr);
        return Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];

    } catch (e) {
        console.error("Failed to generate suggestions:", e);
        return [];
    }
};