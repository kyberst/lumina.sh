
import { GoogleGenAI, Type } from "@google/genai";
import { embeddingService } from '../memory/embedding';
import { vectorStore } from '../memory/vectorStore';
import { MemoryVector } from '../memory/types';

export class PreferenceLearner {
    public static async learnFromTurn(projectId: string, userMsg: string, modelMsg: string) {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        try {
            const prompt = `Analyze the following interaction and extract a 2-line summary of any technical preferences or style choices the user explicitly or implicitly requested.
            
            User: "${userMsg}"
            Architect Response: "${modelMsg.slice(0, 1000)}..."
            
            Return ONLY the 2-line summary.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { temperature: 0.3 }
            });

            const summary = response.text?.trim();
            if (!summary) return;

            const embedding = await embeddingService.embedText(summary);
            const memory: MemoryVector = {
                project_id: projectId,
                content: summary,
                type: 'user_preference',
                embedding,
                timestamp: Date.now(),
                function_names: "",
                variable_definitions: "",
                metadata: { file_path: "memory_stream", exports: [], dependencies: [], last_modified: Date.now() }
            };

            await vectorStore.saveMemories([memory]);
            console.debug("[PreferenceLearner] New preference saved:", summary);
        } catch (e) {
            console.warn("Continuous learning cycle failed", e);
        }
    }
}
