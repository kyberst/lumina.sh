
import { dbCore } from '../db/dbCore';
import { MemoryVector, RetrievalResult } from './types';
import { logger } from '../logger';
import { AppModule } from '../../types';

export class VectorStore {
    private static instance: VectorStore;
    private constructor() {}

    public static getInstance(): VectorStore {
        if (!VectorStore.instance) VectorStore.instance = new VectorStore();
        return VectorStore.instance;
    }

    public async saveMemories(memories: MemoryVector[]): Promise<void> {
        if (memories.length === 0) return;
        const ops = memories.map(mem => ({
            query: `CREATE memories CONTENT $mem`,
            params: { mem }
        }));
        try { await dbCore.executeTransaction(ops); } 
        catch (e) { logger.error(AppModule.CORE, "VectorStore batch save failed", e); }
    }

    public async deleteProjectMemories(projectId: string): Promise<void> {
        await dbCore.query("DELETE memories WHERE project_id = $projectId", { projectId });
    }

    /**
     * HYBRID SEARCH: Combina similitud vectorial con Full-Text Search.
     */
    public async hybridSearch(projectId: string, embedding: number[], query: string, limit: number = 20): Promise<RetrievalResult[]> {
        try {
            // Consulta híbrida: vector similarity + técnico FTS
            const sql = `
                SELECT 
                    *,
                    vector::similarity::cosine(embedding, $embedding) AS v_score,
                    (function_names @@ $query OR variable_definitions @@ $query OR content @@ $query) AS fts_match
                FROM memories 
                WHERE project_id = $projectId 
                ORDER BY v_score DESC 
                LIMIT $limit
            `;
            
            const results = await dbCore.query<any>(sql, { projectId, embedding, query, limit });
            
            return results.map(r => ({
                ...r,
                score: r.v_score,
                fts_score: r.fts_match ? 1.5 : 1.0 // Boost por coincidencia exacta de nombres
            }));
        } catch (e) {
            logger.error(AppModule.CORE, "Hybrid search failed", e);
            return [];
        }
    }
}

export const vectorStore = VectorStore.getInstance();
