
import { GoogleGenAI, Type } from "@google/genai";
import { AppError, AppModule, ChatMessage, JournalEntry, GeneratedFile, RefineAppResult, AIProvider, EnvVarRequest } from "../types";
import { logger } from "./logger";
import { getSystemPrompt } from "./promptService";
import { callCustomLLM } from "./llmService";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new AppError("API Key missing", "API_KEY_MISSING", AppModule.INSIGHT);
  }
  return new GoogleGenAI({ apiKey });
};

interface AppGenerationResult {
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
  attachments?: { name: string; type: string; data: string }[],
  options?: { activeProvider?: AIProvider, activeModelId?: string, thinkingBudget?: 'low' | 'medium' | 'high' }
): Promise<AppGenerationResult> => {
  try {
    let systemPrompt = await getSystemPrompt('builder');
    // Replace placeholders
    systemPrompt = systemPrompt.replace('{{COMPLEXITY}}', complexity.toString());
    systemPrompt = systemPrompt.replace('{{LANG}}', lang);

    const langInstruction = lang === 'es' 
        ? "IMPORTANT: The 'description' field MUST be in SPANISH (Español)." 
        : "IMPORTANT: The 'description' field MUST be in ENGLISH.";
    
    // Budget optimization
    if (options?.thinkingBudget === 'low') {
        systemPrompt += "\nOPTIMIZATION: Be concise. Generate minimal code to satisfy requirements.";
    }

    systemPrompt += `\n${langInstruction}`;

    // --- CUSTOM PROVIDER LOGIC ---
    if (options?.activeProvider && options?.activeModelId && options.activeProvider.id !== 'gemini') {
        logger.info(AppModule.BUILDER, `Generating app with custom provider: ${options.activeProvider.name}`);
        
        const jsonInstruction = `
        CRITICAL OUTPUT INSTRUCTION: 
        You MUST respond with ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
        The JSON structure must be:
        {
          "description": "string (in ${lang})",
          "tags": ["string"],
          "complexityScore": number,
          "files": [
            { "name": "string", "content": "string", "language": "string" }
          ],
          "requiredEnvVars": [{ "key": "string", "description": "string", "type": "text|password|select", "options": ["string"] }]
        }`;
        
        const fullPrompt = `${jsonInstruction}\n\nUser Request: ${prompt}`;
        
        const responseText = await callCustomLLM(
            options.activeProvider,
            options.activeModelId,
            [], 
            fullPrompt,
            systemPrompt
        );

        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson) as AppGenerationResult;
    }

    // --- DEFAULT GEMINI LOGIC ---
    const ai = getClient();
    const modelId = modelPreference === 'pro' ? "gemini-3-pro-preview" : "gemini-2.5-flash";

    const schema = {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: `Short technical summary of the app in ${lang}.` },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tech stack used." },
        complexityScore: { type: Type.NUMBER, description: "0-1 estimation of code complexity." },
        files: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Filename (e.g. index.html)." },
              content: { type: Type.STRING, description: "Full source code." },
              language: { type: Type.STRING, description: "Language (javascript, html, etc)." }
            },
            required: ["name", "content", "language"]
          }
        },
        requiredEnvVars: {
            type: Type.ARRAY,
            description: "List of environment variables needed by the code.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "ENV_VAR_NAME" },
                    description: { type: Type.STRING, description: "What this key is for" },
                    type: { type: Type.STRING, description: "text, password, or select" },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for select type" },
                    defaultValue: { type: Type.STRING }
                },
                required: ["key", "type", "description"]
            }
        }
      },
      required: ["description", "files", "tags", "complexityScore"]
    };

    logger.info(AppModule.BUILDER, `Generating app with Gemini ${modelId}`);
    
    const parts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
        attachments.forEach(att => {
            const cleanBase64 = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
            parts.push({
                inlineData: {
                    mimeType: att.type,
                    data: cleanBase64
                }
            });
        });
    }

    const config: any = { 
        systemInstruction: systemPrompt, 
        temperature: options?.thinkingBudget === 'low' ? 0.2 : 0.7,
        responseMimeType: "application/json",
        responseSchema: schema
    };

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: config
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const result = JSON.parse(jsonText) as AppGenerationResult;
    return result;

  } catch (error: any) {
    logger.error(AppModule.BUILDER, "App generation failed", error);
    if (error instanceof AppError) throw error;
    
    return {
      description: "Generation failed: " + error.message,
      tags: ["Error"],
      files: [{
        name: "error.log",
        content: error.message + "\n\nCheck your API Key or Provider settings.",
        language: "markdown"
      }],
      complexityScore: 0,
      requiredEnvVars: []
    };
  }
};

/**
 * Refine App - Now supporting Streamed Response (Text + Files)
 */
export async function* streamChatRefactor(
  currentFiles: GeneratedFile[],
  userMessage: string,
  history: ChatMessage[],
  lang: 'en' | 'es',
  attachments?: { name: string; type: string; data: string }[],
  options?: { activeProvider?: AIProvider, activeModelId?: string, thinkingBudget?: 'low' | 'medium' | 'high' },
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  try {
    const fileContext = currentFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n');
    const chatContext = history.slice(-15).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    let systemPrompt = await getSystemPrompt('refactor');
    systemPrompt = systemPrompt.replace('{{FILE_CONTEXT}}', fileContext);
    systemPrompt = systemPrompt.replace('{{CHAT_CONTEXT}}', chatContext);
    systemPrompt = systemPrompt.replace('{{LANG}}', lang);
    
    // STREAMING INSTRUCTION FOR GEMINI/LLMs
    systemPrompt += `
    
    CRITICAL STREAMING FORMAT:
    You must output your response in strict sections using these separators:
    
    ### REASONING
    (Explain your technical plan here step-by-step)
    
    ### CMD: command args
    (If you need to install packages or run build steps, output the command here. e.g., npm install lodash)
    
    ### COMMENTARY
    (Talk to the user here. Explain what you are doing in ${lang}.)
    
    ### FILE: filename.ext
    ... content ...
    ### END_FILE
    
    If you need Environment Variables:
    ### ENV_REQ: {"key": "API_KEY", "description": "Needed for X", "type": "text"}
    
    Start immediately with ### REASONING.
    `;

    if (options?.thinkingBudget === 'low') {
        systemPrompt += "\nOPTIMIZATION: Be concise.";
    }

    const ai = getClient();
    const modelId = "gemini-2.5-flash"; 
    
    // Note: Custom providers might not support streaming via this exact interface yet,
    // so we fallback to non-streaming if custom provider is active (simulating stream).
    if (options?.activeProvider && options?.activeModelId && options.activeProvider.id !== 'gemini') {
         // Fallback to non-streaming for custom providers (simplification)
         const result = await callCustomLLM(
             options.activeProvider, 
             options.activeModelId, 
             history, 
             userMessage, 
             systemPrompt
         );
         
         if (signal?.aborted) throw new Error("Aborted");
         yield result;
         return;
    }

    const parts: any[] = [{ text: userMessage }];
    if (attachments) {
        attachments.forEach(att => {
            const cleanBase64 = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
            parts.push({ inlineData: { mimeType: att.type, data: cleanBase64 } });
        });
    }

    const responseStream = await ai.models.generateContentStream({
        model: modelId,
        contents: { parts },
        config: { systemInstruction: systemPrompt }
    });

    for await (const chunk of responseStream) {
        if (signal?.aborted) {
            throw new Error("Aborted by user");
        }
        yield chunk.text;
    }

  } catch (error: any) {
      if (error.message === "Aborted by user") {
          throw error;
      }
      logger.error(AppModule.BUILDER, "Stream failed", error);
      throw error;
  }
}

// Keep the old refactor function for non-streaming fallback if needed
export const refineAppCode = async (
    currentFiles: GeneratedFile[],
    instructions: string,
    history: ChatMessage[],
    lang: 'en' | 'es',
    attachments?: { name: string; type: string; data: string }[],
    options?: { activeProvider?: AIProvider, activeModelId?: string, thinkingBudget?: 'low' | 'medium' | 'high' }
  ): Promise<RefineAppResult> => {
    throw new Error("Use streamChatRefactor instead");
  };

export const chatWithDyad = async (
  history: ChatMessage[], 
  newMessage: string, 
  contextProjects: JournalEntry[], 
  lang: 'en' | 'es',
  attachments?: { name: string; type: string; data: string }[],
  options?: { activeProvider?: AIProvider, activeModelId?: string }
): Promise<string> => {
  const recentContext = contextProjects.slice(0, 3).map(p => 
      `[Project: ${p.project}] Prompt: ${p.prompt} | Stack: ${p.tags.join(', ')}`
    ).join('\n');

  const systemPrompt = lang === 'en'
      ? `You are an expert Software Architect. Context: ${recentContext}. Help the user refine their app ideas, debug code, or plan features. Concise, technical. RESPOND IN ENGLISH.`
      : `Eres un Arquitecto de Software experto. Contexto: ${recentContext}. Ayuda a refinar ideas, depurar o planear. Conciso y técnico. RESPONDE SIEMPRE EN ESPAÑOL.`;

  if (options?.activeProvider && options?.activeModelId && options.activeProvider.id !== 'gemini') {
      return callCustomLLM(
          options.activeProvider,
          options.activeModelId,
          history,
          newMessage,
          systemPrompt
      );
  }

  try {
    const ai = getClient();
    const modelId = "gemini-2.5-flash"; 

    const chat = ai.chats.create({
      model: modelId,
      config: { systemInstruction: systemPrompt }
    });

    const lastTurns = history.slice(-6); 
    for (const msg of lastTurns) {
      if (msg.role === 'user') await chat.sendMessage({ message: msg.text });
    }

    const parts: any[] = [{ text: newMessage }];
    if (attachments && attachments.length > 0) {
      attachments.forEach(att => {
        const cleanBase64 = att.data.includes('base64,') ? att.data.split('base64,')[1] : att.data;
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: cleanBase64
          }
        });
      });
    }

    const response = await chat.sendMessage({ 
        message: parts
    });
    
    return response.text || "...";

  } catch (error: any) {
    logger.error(AppModule.INSIGHT, "Chat failed", error);
    throw new AppError(error.message, "AI_ERR_CHAT", AppModule.INSIGHT);
  }
};

export const analyzeSecurity = async (
  files: GeneratedFile[],
  securityPrompt: string
): Promise<string> => {
    try {
        const ai = getClient();
        const modelId = "gemini-2.5-flash"; 
        
        const fileContent = files.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n');
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `CODE TO ANALYZE:\n${fileContent}\n\nSECURITY CHECK REQUEST: ${securityPrompt}`,
            config: {
                systemInstruction: "You are a Cyber Security Expert. Analyze the provided code for vulnerabilities (XSS, Injection, sensitive data leaks). Be critical and provide remediation steps."
            }
        });
        
        return response.text || "No analysis generated.";
    } catch (error: any) {
        logger.error(AppModule.BUILDER, "Security Check failed", error);
        throw new Error(error.message);
    }
};
