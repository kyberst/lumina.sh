/**
 * Deprecated.
 * Memory services migrated to SurrealDB Embedded (services/memory/index.ts).
 */
import { MemorySettings } from "../../types";

export class QdrantService {
    constructor(private settings: MemorySettings) {}
    async ensureCollection() {}
    async upsert(id: string, vector: number[], payload: any) {}
    async search(vector: number[]): Promise<string[]> { return []; }
}