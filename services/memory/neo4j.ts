/**
 * Deprecated.
 * Memory services migrated to SurrealDB Embedded (services/memory/index.ts).
 */
import { MemorySettings } from "../../types";

export class Neo4jService {
    constructor(private settings: MemorySettings) {}
    async execute(cypher: string, params: any = {}) { return null; }
    async saveInteraction(sessionId: string, userText: string, aiResponse: string, filesTouched: string[]) {}
    async getRelatedContext(text: string): Promise<string[]> { return []; }
}