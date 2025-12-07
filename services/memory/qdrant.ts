
import { MemorySettings } from "../../types";
import { logger } from "../logger";
import { AppModule } from "../../types";

const COLLECTION_NAME = "lumina_memory";

export class QdrantService {
    constructor(private settings: MemorySettings) {}

    private getHeaders() {
        const headers: any = { 'Content-Type': 'application/json' };
        if (this.settings.qdrantKey) headers['api-key'] = this.settings.qdrantKey;
        return headers;
    }

    async ensureCollection() {
        if (!this.settings.enabled) return;
        try {
            const url = `${this.settings.qdrantUrl}/collections/${COLLECTION_NAME}`;
            // Check existence
            const check = await fetch(url, { headers: this.getHeaders() });
            if (check.ok) return;

            // Create collection (768 dimensions for gemini-embedding-001)
            await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    vectors: { size: 768, distance: "Cosine" }
                })
            });
        } catch (e) {
            logger.error(AppModule.CORE, "Qdrant connection failed", e);
        }
    }

    async upsert(id: string, vector: number[], payload: any) {
        if (!this.settings.enabled) return;
        try {
            await this.ensureCollection();
            const url = `${this.settings.qdrantUrl}/collections/${COLLECTION_NAME}/points?wait=true`;
            await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    points: [{ id, vector, payload }]
                })
            });
        } catch (e) {
            console.error("Qdrant Upsert Error", e);
        }
    }

    async search(vector: number[]): Promise<string[]> {
        if (!this.settings.enabled) return [];
        try {
            await this.ensureCollection();
            const url = `${this.settings.qdrantUrl}/collections/${COLLECTION_NAME}/points/search`;
            const res = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    vector,
                    limit: 3,
                    with_payload: true
                })
            });
            
            if (!res.ok) return [];
            const data = await res.json();
            // Return textual context from payload
            return data.result.map((item: any) => item.payload.text);
        } catch (e) {
            return [];
        }
    }
}
