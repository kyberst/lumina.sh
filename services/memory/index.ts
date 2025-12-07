import { GoogleGenAI } from "@google/genai";
import { AppSettings, ChatMessage, GeneratedFile } from "../../types";
import { dbCore } from "../db/dbCore";
import { logger } from "../logger";
import { AppModule } from "../../types";

export class MemoryOrchestrator {

    constructor(private settings: AppSettings) {}

    private async getEmbedding(text: string): Promise<number[]> {
        if (!process.env.API_KEY) return [];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: { parts: [{ text }] }
        });
        return res.embeddings?.[0]?.values || [];
    }

    /**
     * Index the codebase to build the Knowledge Graph (Files + Dependencies).
     * This allows the RAG system to understand file relationships.
     */
    public async syncCodebase(files: GeneratedFile[]) {
        if (!this.settings.memory.enabled) return;
        
        try {
            for (const file of files) {
                // Upsert File Node with Content for RAG Context
                await dbCore.query(`UPDATE type::thing('files', $name) CONTENT { name: $name, content: $content }`, { name: file.name, content: file.content });
                
                // Parse Imports (Simple Regex for JS/TS/CSS)
                const imports = this.extractImports(file);
                for (const imp of imports) {
                     // Create 'imports' edge: file -> imports -> imported_file
                     // We use RELATE which handles idempotency well in SurrealDB
                     await dbCore.query(`
                        RELATE type::thing('files', $src)->imports->type::thing('files', $target)
                     `, { src: file.name, target: imp });
                }
            }
        } catch (e) {
            logger.warn(AppModule.CORE, "Failed to sync codebase graph", e);
        }
    }

    private extractImports(file: GeneratedFile): string[] {
        const imports: Set<string> = new Set();
        // Regex for ES6 imports and CSS imports
        const regex = /import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|@import\s+['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = regex.exec(file.content)) !== null) {
            let path = match[1] || match[2];
            if (!path) continue;
            // Normalize path (simple version)
            path = path.replace(/^\.\//, ''); 
            // Filter out external libraries (crudely, if it doesn't look like a local file path)
            if (path.startsWith('.') || path.includes('/')) {
                // Try to match extension if missing (guess .ts, .tsx, .js)
                if (!path.includes('.')) path = path + '.tsx'; // Guessing
                imports.add(path);
            }
        }
        return Array.from(imports);
    }

    /**
     * High Precision Context Extraction.
     * Executes a composite query to fetch Semantic Memory (Vectors) + Structural Context (Graph).
     */
    async retrieveContext(query: string): Promise<string> {
        if (!this.settings.memory.enabled) return "";

        const vector = await this.getEmbedding(query);
        if (vector.length === 0) return "";

        try {
            // Composite Query:
            // 1. Find relevant memories by Vector Similarity
            // 2. Traverse to modified files
            // 3. From those files, traverse graph to find Dependencies (imports) and Dependents (imported_by)
            const results = await dbCore.query<any>(`
                SELECT 
                    content,
                    vector::similarity::cosine(embedding, $vector) as score,
                    (
                        SELECT 
                            name,
                            content,
                            (SELECT value->imports->files.name FROM $parent) as imports,
                            (SELECT value<-imports<-files.name FROM $parent) as imported_by
                        FROM ->modified->files
                    ) as related_code
                FROM memories 
                WHERE embedding IS NOT NONE
                ORDER BY score DESC
                LIMIT 3
            `, { vector });
            
            if (results.length === 0) return "";

            // Format Output as structured JSON for the LLM
            const structuredContext = results.map(r => {
                const file = r.related_code?.[0]; // Get first related file from graph traversal
                if (!file) return null;

                const importsList = (file.imports || []).flat().filter((x:any)=>x).join(', ');
                const importedByList = (file.imported_by || []).flat().filter((x:any)=>x).join(', ');
                
                let dependencyText = "";
                if (importsList) dependencyText += `Imports: [${importsList}]. `;
                if (importedByList) dependencyText += `Imported by: [${importedByList}].`;
                if (!dependencyText) dependencyText = "No immediate dependencies found.";

                return {
                    semantic_match_file: file.name,
                    semantic_match_code: file.content ? `// ...snippet from ${file.name}\n${file.content.slice(0, 500)}...` : r.content.slice(0, 300),
                    dependency_relations: dependencyText
                };
            }).filter(Boolean);

            if (structuredContext.length === 0) return "";

            return `\n[Architectural Context (RAG)]:\n${JSON.stringify(structuredContext, null, 2)}\n`;

        } catch (e) {
            logger.error(AppModule.CORE, "Memory retrieval failed", e);
            return "";
        }
    }

    async saveInteraction(entry: ChatMessage, responseText: string, modifiedFiles: string[]) {
        if (!this.settings.memory.enabled) return;
        
        const content = `User: ${entry.text}\nAI: ${responseText.slice(0, 500)}`;
        const vector = await this.getEmbedding(entry.text);
        
        if (vector.length > 0) {
            try {
                const memoryId = entry.id;
                await dbCore.query(`
                    UPDATE type::thing('memories', $id) CONTENT {
                        embedding: $vector,
                        content: $content,
                        timestamp: time::now()
                    }
                `, { id: memoryId, vector, content });

                for (const file of modifiedFiles) {
                    // Create graph edge: memory -> modified -> file
                    // Ensure file node exists (idempotent update)
                    await dbCore.query(`
                        UPDATE type::thing('files', $fid) SET name = $fid;
                        RELATE type::thing('memories', $mid)->modified->type::thing('files', $fid);
                    `, { mid: memoryId, fid: file });
                }
            } catch (e) {
                logger.error(AppModule.CORE, "Memory save failed", e);
            }
        }
    }
}