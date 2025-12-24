
import { GeneratedFile, JournalEntry } from '../../types';
import { embeddingService } from './embedding';
import { vectorStore } from './vectorStore';
import { graphService } from './graphService';
import { ChunkingOptions, MemoryVector, RAGContext } from './types';

/**
 * Hybrid RAG Service.
 * Combines semantic vector search with relational knowledge graph traversal.
 */
export class RAGService {
    private static instance: RAGService;

    public static getInstance(): RAGService {
        if (!RAGService.instance) RAGService.instance = new RAGService();
        return RAGService.instance;
    }

    /** Dynamic Context Decision: prioritizing nodes based on query semantics */
    public async retrieveContext(projectId: string, prompt: string): Promise<RAGContext> {
        try {
            // 1. Vector Search (Code snippets)
            const vec = await embeddingService.embedText(prompt);
            const vectors = await vectorStore.search(projectId, vec, 4);
            
            // 2. Graph Retrieval (Decisions/Preferences)
            const nodes = await graphService.getRelevantContext(projectId, prompt);
            
            // 3. Global Context Injection (Dynamic Context Rule)
            // If the user asks about design, always pull all design preferences
            if (prompt.match(/design|color|theme|style|ui/i)) {
                const designNodes = await graphService.getRelevantContext(projectId, "preference");
                designNodes.forEach(n => { if (!nodes.includes(n)) nodes.push(n); });
            }
            
            // Fix: Return renamed properties snippets and patterns
            return {
                snippets: vectors.map(v => v.content),
                patterns: nodes
            };
        } catch (e) {
            // Fix: Return renamed properties snippets and patterns
            return { snippets: [], patterns: [] };
        }
    }

    public async indexProject(entry: JournalEntry): Promise<void> {
        if (!entry.projects_id || entry.pendingGeneration) return;

        // Run async in background
        setTimeout(async () => {
            try {
                // A. Vectorize Code
                await vectorStore.deleteProjectMemories(entry.projects_id);
                const options: ChunkingOptions = { maxSize: 1200, overlap: 200 };
                const memories: MemoryVector[] = [];

                for (const file of entry.files) {
                    if (file.content.length > 30000) continue;
                    const chunks = this.chunkText(file.name, file.content, options);
                    for (const chunk of chunks) {
                        const embedding = await embeddingService.embedText(chunk);
                        memories.push({ project_id: entry.projects_id, content: chunk, type: 'code_chunk', metadata: { file: file.name }, embedding, timestamp: Date.now() });
                    }
                }
                await vectorStore.saveMemories(memories);

                // B. Analyze Topology
                await graphService.analyzeProjectTopology(entry.projects_id, entry.files);
            } catch (e) { console.error("Hybrid Indexing failed", e); }
        }, 100);
    }

    private chunkText(name: string, content: string, opt: ChunkingOptions): string[] {
        const chunks = [];
        let i = 0;
        while (i < content.length) {
            chunks.push(`FILE: ${name}\n${content.slice(i, i + opt.maxSize)}`);
            i += (opt.maxSize - opt.overlap);
        }
        return chunks;
    }
}

export const ragService = RAGService.getInstance();
