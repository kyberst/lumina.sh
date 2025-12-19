
import { GeneratedFile, JournalEntry } from '../../types';
import { embeddingService } from './embedding';
import { vectorStore } from './vectorStore';
import { ChunkingOptions, MemoryVector, RAGContext } from './types';
import { logger } from '../logger';
import { AppModule } from '../../types';

export class RAGService {
    private static instance: RAGService;

    private constructor() {}

    public static getInstance(): RAGService {
        if (!RAGService.instance) {
            RAGService.instance = new RAGService();
        }
        return RAGService.instance;
    }

    /**
     * Splits code into logical chunks.
     */
    private chunkFile(file: GeneratedFile, options: ChunkingOptions): string[] {
        const chunks: string[] = [];
        const content = file.content;
        
        if (content.length < options.maxSize) {
            return [`File: ${file.name}\nLanguage: ${file.language}\n\n${content}`];
        }

        let start = 0;
        while (start < content.length) {
            const end = Math.min(start + options.maxSize, content.length);
            const chunkText = content.slice(start, end);
            chunks.push(`File: ${file.name} (Part)\nLanguage: ${file.language}\n\n${chunkText}`);
            start += (options.maxSize - options.overlap);
        }
        return chunks;
    }

    /**
     * Index a full project into Vector Memory.
     * Uses local embeddings and SurrealDB.
     */
    public async indexProject(entry: JournalEntry): Promise<void> {
        // Prevent indexing if generation is still pending (incomplete files) or no ID
        if (entry.pendingGeneration || !entry.id) return;

        // Fire and forget - don't block
        setTimeout(async () => {
            try {
                logger.info(AppModule.CORE, `Starting Local RAG Indexing for project ${entry.project} (${entry.id})`);
                
                // 1. Clear old memories for this project
                await vectorStore.deleteProjectMemories(entry.id);

                const memories: MemoryVector[] = [];
                const options: ChunkingOptions = { maxSize: 1500, overlap: 300 };

                for (const file of entry.files) {
                    // Skip extremely large assets
                    if (file.content.length > 50000) continue;

                    const chunks = this.chunkFile(file, options);
                    
                    for (const chunk of chunks) {
                        const embedding = await embeddingService.embedText(chunk);
                        
                        // Only save valid vectors
                        if (embedding.some(v => v !== 0)) {
                            memories.push({
                                project_id: entry.id,
                                content: chunk,
                                metadata: { filename: file.name, language: file.language },
                                type: 'code_chunk',
                                embedding,
                                timestamp: Date.now()
                            });
                        }
                    }
                }

                if (memories.length > 0) {
                    await vectorStore.saveMemories(memories);
                    logger.info(AppModule.CORE, `Indexed ${memories.length} chunks for ${entry.project}`);
                }
            } catch (e) {
                logger.warn(AppModule.CORE, `Background Indexing Failed`, e);
            }
        }, 100);
    }

    /**
     * Retrieve relevant context for a user prompt.
     */
    public async retrieveContext(projectId: string, userPrompt: string): Promise<RAGContext> {
        try {
            const queryEmbedding = await embeddingService.embedText(userPrompt);
            
            // Get top 4 most relevant chunks
            const results = await vectorStore.search(projectId, queryEmbedding, 4);
            
            return {
                relevantSnippets: results.map(r => r.content),
                relatedPatterns: [] 
            };
        } catch (e) {
            logger.warn(AppModule.CORE, "RAG Retrieval failed", e);
            return { relevantSnippets: [], relatedPatterns: [] };
        }
    }
}

export const ragService = RAGService.getInstance();
