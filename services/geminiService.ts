
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, GeneratedFile, AppSettings, SecurityReport } from '../types';
import { getRefactorSystemPrompt } from './ai/prompts/refactor';
import { generateFSManifest } from './ai/utils/manifest';

export async function* streamChatRefactor(
    files: GeneratedFile[],
    prompt: string,
    history: ChatMessage[],
    lang: 'en' | 'es' | 'fr' | 'de',
    attachments: any[],
    options: { 
        settings: Partial<AppSettings>, 
        ragContext?: { snippets: string[], patterns: string[] },
        anchors?: { style_anchors: string[], architectural_anchors: string[], project_summary: string },
        fsManifest?: string 
    },
    signal: AbortSignal
): AsyncGenerator<{ text: string, usage?: any }, void, unknown> {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = options.settings.aiModel === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const sys = getRefactorSystemPrompt(lang, options.settings.contextSize || 'default', options.settings.autoApprove ?? true);
    
    // Inyectar Anclajes de Contexto (Identity Guardrails)
    let anchorCtx = "";
    if (options.anchors) {
        anchorCtx = `
[IDENTITY_GUARDRAILS]
- Project Architecture: ${options.anchors.architectural_anchors.join(', ') || 'Standard'}
- Technical Summary: ${options.anchors.project_summary}
- Style Constraints: ${options.anchors.style_anchors.join(', ') || 'Modern Functional'}
`;
    }

    const snippets = options.ragContext?.snippets?.length ? `\n[SEMANTIC_MEMORIES]:\n${options.ragContext.snippets.join('\n---\n')}\n` : '';
    const patterns = options.ragContext?.patterns?.length ? `\n[RELATIONAL_GRAPH_NODES]:\n${options.ragContext.patterns.join('\n')}\n` : '';
    const manifest = options.fsManifest || generateFSManifest(files);
    const fileCtx = files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n');
    
    const finalPrompt = `${anchorCtx}${patterns}${snippets}\n${manifest}\n\nCURRENT_CODEBASE:\n${fileCtx}\n\nUSER_COMMAND: ${prompt}`;
    
    const geminiHistory = history.filter(h => h.text).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction: sys, temperature: 0.1 }, 
        history: geminiHistory
    });

    const result = await chat.sendMessageStream({ message: finalPrompt });
    for await (const chunk of result) {
        if (signal.aborted) break;
        const c = chunk as GenerateContentResponse;
        yield { text: c.text ?? "", usage: c.usageMetadata };
    }
}

/**
 * Fix: Added missing analyzeSecurity function to perform code auditing via Gemini.
 * Uses JSON mode to ensure structured output matching the SecurityReport schema.
 */
export async function analyzeSecurity(
    files: GeneratedFile[],
    prompt: string,
    signal: AbortSignal
): Promise<SecurityReport> {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fileCtx = files.map(f => `FILE: ${f.name}\n${f.content}`).join('\n\n');
    
    // Using gemini-3-flash-preview as recommended for text-based simple Q&A tasks
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Review the following codebase for security vulnerabilities, logic errors, and performance issues:\n\n${fileCtx}\n\nContext/Task: ${prompt}`,
        config: {
            systemInstruction: "You are a senior security engineer. Analyze the code and return a detailed report in JSON format. Be critical and precise.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    healthScore: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    severityDistribution: {
                        type: Type.OBJECT,
                        properties: {
                            critical: { type: Type.NUMBER },
                            high: { type: Type.NUMBER },
                            medium: { type: Type.NUMBER },
                            low: { type: Type.NUMBER }
                        },
                        required: ['critical', 'high', 'medium', 'low']
                    },
                    issues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                title: { type: Type.STRING },
                                severity: { type: Type.STRING },
                                description: { type: Type.STRING },
                                location: { type: Type.STRING },
                                recommendation: { type: Type.STRING },
                                fixPrompt: { type: Type.STRING }
                            },
                            required: ['id', 'title', 'severity', 'description', 'location', 'recommendation', 'fixPrompt']
                        }
                    }
                },
                required: ['healthScore', 'summary', 'severityDistribution', 'issues']
            }
        }
    });

    if (signal.aborted) throw new Error("Scan Cancelled");
    
    try {
        const text = response.text;
        if (!text) throw new Error("AI returned an empty response.");
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse security report JSON", e, response.text);
        throw new Error("Invalid security report format from AI.");
    }
}
