
import { GeneratedFile } from '../../types';

export type MemoryType = 'code_chunk' | 'architectural_pattern' | 'user_preference' | 'chat_summary';

export interface MemoryVector {
    id?: string;
    project_id: string;
    content: string;
    metadata: Record<string, any>;
    type: MemoryType;
    embedding: number[];
    timestamp: number;
}

export interface RetrievalResult extends MemoryVector {
    score: number;
}

export interface ChunkingOptions {
    maxSize: number; // Max characters per chunk
    overlap: number; // Overlap for context continuity
}

export interface RAGContext {
    relevantSnippets: string[];
    relatedPatterns: string[];
}
