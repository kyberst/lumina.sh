import { generateAppCode as genApp } from "./ai/generator";
import { GoogleGenAI } from "@google/genai";
import { AppError, AppModule, ChatMessage, GeneratedFile, AIProvider } from "../types";
import { logger } from "./logger";
import { callCustomLLM } from "./llmService";

export const generateAppCode = genApp;

export interface StreamChunk {
    text: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: any[],
  options?: any,
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
    try {
        const fileContext = currentFiles.map(f => `<file name="${f.name}">\n${f.content}\n</file>`).join('\n\n');
        
        // Protocol matching services/ai/streamParser.ts
        const protocol = `
**Protocol & Output Format (Strictly Enforced):**
You MUST use the following XML tags for your response. Do not use Markdown headers (###) or markdown code blocks (\`\`\`) for these sections.

1. **Reasoning**:
   <lumina-reasoning>
   Thinking process and architectural plan...
   </lumina-reasoning>

2. **Summary**:
   <lumina-summary>
   Message to the user explaining what you did...
   </lumina-summary>

3. **Files**:
   To create or overwrite a file:
   <lumina-file name="filename.ext">
   ...full file content...
   </lumina-file>
   
   To patch an existing file (preferred for small changes):
   <lumina-patch name="filename.ext">
   <<<< SEARCH
   ...exact original lines to find...
   ==== REPLACE
   ...new lines...
   >>>> END
   </lumina-patch>

4. **Commands**:
   <lumina-command type="shell">
   npm install ...
   </lumina-command>

IMPORTANT: 
- Do not output plain text outside of these tags. 
- Ensure closing tags (e.g., </lumina-file>) are present.
- For <lumina-file>, the content must be the COMPLETE file code.
`;

        const sysPrompt = `
You are an expert Senior Software Engineer.
Goal: Update the application code based on the user's request.

${protocol}

**Rules:**
- **Reasoning First**: Always start with <lumina-reasoning>.
- **Smart Patching**: Use PATCH for small changes. SEARCH block must match EXACTLY (whitespace sensitive).
- **Language**: Respond in ${lang === 'es' ? 'Spanish' : 'English'} for the reasoning/summary.
- **Dependencies**: If new packages are needed, use <lumina-command>.

Current Codebase:
${fileContext}
`;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const historyContent = history
            .filter(h => !h.isStreaming && h.text && h.text.trim().length > 0) 
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));

        let thinkingBudgetTokens: number | undefined = undefined;
        if (options?.thinkingBudget) {
            if (typeof options.thinkingBudget === 'number') {
                thinkingBudgetTokens = options.thinkingBudget;
            } else if (typeof options.thinkingBudget === 'string') {
                switch(options.thinkingBudget) {
                    case 'low': thinkingBudgetTokens = 2048; break;
                    case 'medium': thinkingBudgetTokens = 8192; break;
                    case 'high': thinkingBudgetTokens = 16384; break;
                    default: thinkingBudgetTokens = 4096;
                }
            }
        }

        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: { 
                systemInstruction: sysPrompt,
                temperature: 0.2, 
                thinkingConfig: thinkingBudgetTokens ? { thinkingBudget: thinkingBudgetTokens } : undefined
            },
            history: historyContent
        });

        const parts: any[] = [{ text: userMessage }];
        if (attachments && attachments.length > 0) {
            attachments.forEach(att => {
                const base64Data = att.data.split(',')[1];
                parts.push({
                    inlineData: {
                        mimeType: att.type,
                        data: base64Data
                    }
                });
            });
        }

        const stream = await chat.sendMessageStream({ message: parts });

        for await (const chunk of stream) {
            if (signal?.aborted) throw new Error("Aborted");
            
            const usage = chunk.usageMetadata ? {
                inputTokens: chunk.usageMetadata.promptTokenCount || 0,
                outputTokens: chunk.usageMetadata.candidatesTokenCount || 0
            } : undefined;

            yield {
                text: chunk.text,
                usage
            };
        }
    } catch (e: any) {
        logger.error(AppModule.BUILDER, "Stream failed", e);
        throw e;
    }
}

export const chatWithDyad = async (
  history: ChatMessage[], newMessage: string, projects: any[], lang: 'en' | 'es', attachments?: any[], options?: any
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction: "You are an expert Architect." } });
    const res = await chat.sendMessage({ message: newMessage });
    return res.text || "...";
};

export const analyzeSecurity = async (files: GeneratedFile[], prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze:\n${files.map(f => f.content).join('\n')}\nRequest: ${prompt}`
    });
    return res.text || "No issues.";
};