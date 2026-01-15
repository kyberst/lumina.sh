
import { GeneratedFile } from '../../types';

export type MemoryType = 'code_chunk' | 'architectural_pattern' | 'user_preference' | 'chat_summary';

export interface MemoryVector {
    id?: string;
    project_id: string;
    content: string;
    metadata: {
        file_path: string;
        exports: string[];
        dependencies: string[];
        last_modified: number;
    };
    function_names: string;
    variable_definitions: string;
    type: MemoryType;
    embedding: number[];
    timestamp: number;
}

export interface RetrievalResult extends MemoryVector {
    score: number;
    fts_score?: number;
    relevance_kind?: 'direct' | 'support';
}

export interface ChunkingOptions {
    maxSize: number;
    overlap: number;
}

export interface RAGContext {
    snippets: string[];
    patterns: string[];
    optimizer_metadata?: any;
}
