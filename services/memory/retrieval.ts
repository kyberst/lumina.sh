
import { AppSettings, AppModule } from "../../types";
import { dbCore } from "../db/dbCore";
import { logger } from "../logger";

export const retrieveContext = async (query: string, getEmbeddingFn: (t: string) => Promise<number[]>, settings: AppSettings): Promise<string> => {
    const startTime = performance.now();
    const vector = await getEmbeddingFn(query);
    if (vector.length === 0) return "";

    try {
        const [symbolResults, memoryResults] = await Promise.all([
            dbCore.query<any>(`
                SELECT name, file, doc, signature, vector::similarity::cosine(embedding, $vector) as score
                FROM symbols WHERE embedding IS NOT NONE ORDER BY score DESC LIMIT 3
            `, { vector }),
            dbCore.query<any>(`
                SELECT content, vector::similarity::cosine(embedding, $vector) as score,
                (SELECT name, content FROM ->modified->files) as related_code
                FROM memories WHERE embedding IS NOT NONE ORDER BY score DESC LIMIT 2
            `, { vector })
        ]);
        
        const endTime = performance.now();
        logger.info(AppModule.CORE, `RAG Retrieval Perf: ${Math.round(endTime - startTime)}ms`, {
            telemetryId: settings.telemetryId, latencyMs: endTime - startTime, queryLength: query.length,
            symbolsFound: symbolResults.length, memoriesFound: memoryResults.length
        });
        
        if (symbolResults.length === 0 && memoryResults.length === 0) return "";

        const contextParts: string[] = [];
        if (symbolResults.length > 0) {
            const symbols = symbolResults.map(s => ({
                symbol: s.name, file: s.file, type: s.type, description: s.doc || "No docstring", signature: s.signature
            }));
            contextParts.push(`[Codebase Symbols (Smart Index)]:\n${JSON.stringify(symbols, null, 2)}`);
        }
        if (memoryResults.length > 0) {
                const memories = memoryResults.map(m => ({
                memory: m.content, related_files: m.related_code?.map((f:any) => f.name) || []
                }));
                contextParts.push(`[Past Interactions]:\n${JSON.stringify(memories, null, 2)}`);
        }
        return contextParts.join("\n\n");
    } catch (e) {
        logger.error(AppModule.CORE, "Memory retrieval failed", e);
        return "";
    }
};


/**
 * Finds the most semantically similar code file to a given query.
 */
export const findSimilarCode = async (
    query: string, 
    getEmbeddingFn: (t: string) => Promise<number[]>,
    similarityThreshold: number = 0.85
): Promise<{ file: string, score: number } | null> => {
    const vector = await getEmbeddingFn(query);
    if (vector.length === 0) return null;

    try {
        // Query files table using vector similarity.
        const results = await dbCore.query<any>(`
            SELECT name, vector::similarity::cosine(embedding, $vector) as score
            FROM files 
            WHERE embedding IS NOT NONE
            ORDER BY score DESC
            LIMIT 1
        `, { vector });

        if (results && results.length > 0) {
            const topMatch = results[0];
            if (topMatch.score > similarityThreshold) {
                return { file: topMatch.name, score: topMatch.score };
            }
        }
        return null;
    } catch (e) {
        logger.warn(AppModule.CORE, "Similarity search for code reuse failed.", e);
        return null;
    }
};
