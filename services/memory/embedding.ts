
import { logger } from '../logger';
import { AppModule } from '../../types';

/**
 * Service responsible for converting text into vector representations locally.
 * Uses a deterministic bit-hashing algorithm (SimHash-inspired) to create
 * 768-dimensional vectors from text without external APIs.
 * This ensures data remains local and vectors are reproducible.
 */
export class EmbeddingService {
    private static instance: EmbeddingService;
    private readonly DIMENSIONS = 768; // Standard vector size compatibility

    private constructor() {}

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    /**
     * Generates a 768-dimensional vector for the given text using local hashing.
     */
    public async embedText(text: string): Promise<number[]> {
        try {
            const vec = new Float32Array(this.DIMENSIONS);
            // 1. Tokenize: lowercase, split by non-word chars, filter short words
            const words = text.toLowerCase().split(/[^\w]+/).filter(w => w.length > 2);

            for (const w of words) {
                // 2. Hash each word to map it to vector indices
                let h = 0;
                for (let i = 0; i < w.length; i++) {
                    h = Math.imul(31, h) + w.charCodeAt(i) | 0;
                }
                
                // 3. Update vector dimensions based on hash
                const index = Math.abs(h) % this.DIMENSIONS;
                const sign = (h & 1) === 0 ? 1 : -1;
                
                vec[index] += sign;
                // Spread influence to neighbor to simulate semantic overlap
                vec[(index + 1) % this.DIMENSIONS] += sign * 0.5;
            }

            // 4. L2 Normalization for Cosine Similarity
            let norm = 0;
            for (let i = 0; i < this.DIMENSIONS; i++) {
                norm += vec[i] * vec[i];
            }
            norm = Math.sqrt(norm);
            
            if (norm > 0) {
                for (let i = 0; i < this.DIMENSIONS; i++) {
                    vec[i] /= norm;
                }
            }

            return Array.from(vec);
        } catch (e: any) {
            logger.error(AppModule.CORE, `Local embedding failed`, e);
            return new Array(this.DIMENSIONS).fill(0);
        }
    }

    public async embedBatch(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map(t => this.embedText(t)));
    }
}

export const embeddingService = EmbeddingService.getInstance();
