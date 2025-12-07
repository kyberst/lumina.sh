
import { GoogleGenAI } from "@google/genai";
import { AppSettings, ChatMessage } from "../../types";
import { QdrantService } from "./qdrant";
import { Neo4jService } from "./neo4j";

export class MemoryOrchestrator {
    private qdrant: QdrantService;
    private neo4j: Neo4jService;

    constructor(private settings: AppSettings) {
        this.qdrant = new QdrantService(settings.memory);
        this.neo4j = new Neo4jService(settings.memory);
    }

    private async getEmbedding(text: string): Promise<number[]> {
        if (!process.env.API_KEY) return [];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: { parts: [{ text }] }
        });
        return res.embeddings?.[0]?.values || [];
    }

    async retrieveContext(query: string): Promise<string> {
        if (!this.settings.memory.enabled) return "";

        const vector = await this.getEmbedding(query);
        
        // Parallel retrieval
        const [similarChats, graphInsights] = await Promise.all([
            vector.length > 0 ? this.qdrant.search(vector) : [],
            this.neo4j.getRelatedContext(query)
        ]);

        let context = "";
        if (similarChats.length > 0) {
            context += `\n[Memory - Similar Past Conversations]:\n${similarChats.join('\n---\n')}\n`;
        }
        if (graphInsights.length > 0) {
            context += `\n[Memory - Knowledge Graph]:\n${graphInsights.join('\n')}\n`;
        }
        return context;
    }

    async saveInteraction(entry: ChatMessage, responseText: string, modifiedFiles: string[]) {
        if (!this.settings.memory.enabled) return;
        
        const vector = await this.getEmbedding(entry.text);
        
        // Save Vector (User Input)
        if (vector.length > 0) {
            await this.qdrant.upsert(
                entry.id, 
                vector, 
                { text: `User: ${entry.text}\nAI: ${responseText.slice(0, 200)}...` }
            );
        }

        // Save Graph
        await this.neo4j.saveInteraction("global_session", entry.text, responseText, modifiedFiles);
    }
}
