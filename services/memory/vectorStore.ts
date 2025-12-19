
import { dbCore } from '../db/dbCore';
import { MemoryVector, RetrievalResult } from './types';
import { logger } from '../logger';
import { AppModule } from '../../types';

/**
 * Handles persistence and vector similarity search within SurrealDB (WASM).
 */
export class VectorStore {
    private static instance: VectorStore;

    private constructor() {}

    public static getInstance(): VectorStore {
        if (!VectorStore.instance) {
            VectorStore.instance = new VectorStore();
        }
        return VectorStore.instance;
    }

    public async saveMemory(memory: MemoryVector): Promise<void> {
        try {
            await dbCore.query(`CREATE memories CONTENT $memory`, { memory });
        } catch (e) {
            logger.error(AppModule.CORE, "Failed to save memory vector", e);
        }
    }

    public async saveMemories(memories: MemoryVector[]): Promise<void> {
        if (memories.length === 0) return;
        
        // Chunking
        const chunkSize = 20; 
        for (let i = 0; i < memories.length; i += chunkSize) {
            const chunk = memories.slice(i, i + chunkSize);
            
            // Map individual CREATE statements using SET to explicitly bind fields.
            // This bypasses issues with 'CONTENT $object' in transactions occasionally losing nested keys.
            const ops = chunk.map(mem => ({
                query: `
                    CREATE memories SET 
                        project_id = $mem.project_id,
                        content = $mem.content,
                        embedding = $mem.embedding,
                        type = $mem.type,
                        metadata = $mem.metadata,
                        timestamp = $mem.timestamp
                `,
                params: { mem }
            }));

            try {
                await dbCore.executeTransaction(ops);
            } catch (e) {
                logger.error(AppModule.CORE, "Failed to save batch memories chunk", e);
            }
        }
    }

    public async deleteProjectMemories(projectId: string): Promise<void> {
        await dbCore.query("DELETE memories WHERE project_id = $projectId", { projectId });
    }

    /**
     * Performs a cosine similarity search on the embedded vectors.
     * Note: vector::similarity::cosine is a built-in SurrealDB function.
     */
    public async search(projectId: string, queryEmbedding: number[], limit: number = 5): Promise<RetrievalResult[]> {
        try {
            // 1. Calculate similarity
            // 2. Filter by project
            // 3. Sort by similarity (descending)
            const query = `
                SELECT 
                    *, 
                    vector::similarity::cosine(embedding, $queryEmbedding) AS score 
                FROM memories 
                WHERE project_id = $projectId 
                ORDER BY score DESC 
                LIMIT $limit
            `;
            
            const results = await dbCore.query<RetrievalResult>(query, { 
                projectId, 
                queryEmbedding, 
                limit 
            });

            // Filter out low relevance (noise)
            return results.filter(r => r.score > 0.65);

        } catch (e) {
            logger.error(AppModule.CORE, "Vector search failed", e);
            return [];
        }
    }
}

export const vectorStore = VectorStore.getInstance();
