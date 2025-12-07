import { GoogleGenAI } from "@google/genai";
import { logger } from "../logger";
import { AppModule } from "../../types";

export const getEmbedding = async (text: string): Promise<number[]> => {
    if (!process.env.API_KEY) return [];
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: { parts: [{ text }] }
        });
        return res.embeddings?.[0]?.values || [];
    } catch (e) {
        logger.warn(AppModule.CORE, "Embedding failed", e);
        return [];
    }
};
