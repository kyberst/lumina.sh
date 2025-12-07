
import { GoogleGenAI } from "@google/genai";
import { AppSettings, ChatMessage, GeneratedFile } from "../../types";
import { dbCore } from "../db/dbCore";
import { logger } from "../logger";
import { AppModule } from "../../types";

interface CodeSymbol {
    name: string;
    type: string;
    doc: string;
    signature: string;
}

export class MemoryOrchestrator {

    constructor(private settings: AppSettings) {}

    private async getEmbedding(text: string): Promise<number[]> {
        if (!process.env.API_KEY) return [];
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const res = await ai.models.embedContent({
                model: "text-embedding-004",
                contents: { parts: [{ text }] }
            });
            return res.embeddings?.[0]?.values || [];
        } catch (e) {
            logger.warn(AppModule.CORE, "Embedding failed", e);
            return [];
        }
    }

    /**
     * Extracts high-level code symbols (Functions, Classes, Interfaces) and their JSDocs.
     * Uses regex heuristics for lightweight extraction in the browser.
     */
    private extractSymbols(content: string): CodeSymbol[] {
        const symbols: CodeSymbol[] = [];
        // Regex captures JSDoc (Group 1), Type (Group 2), and Name (Group 3)
        // Matches: /** doc */ export async function myFunc
        const regex = /(?:\/\*\*([\s\S]*?)\*\/[\s\n]*)?(?:export\s+)?(?:async\s+)?(function|class|const|let|var|interface|type)\s+([a-zA-Z0-9_]+)/gm;
        
        let match;
        // Limit iterations to prevent potential regex DoS on large files
        let limit = 0;
        while ((match = regex.exec(content)) !== null && limit < 100) {
            limit++;
            const jsdoc = match[1] ? match[1].replace(/^\s*\*+/gm, '').trim() : '';
            const type = match[2];
            const name = match[3];
            
            // Only index significant symbols (Functions/Classes or documented Variables)
            if (jsdoc.length > 0 || ['function', 'class', 'interface'].includes(type)) {
                symbols.push({
                    name,
                    type,
                    doc: jsdoc,
                    signature: match[0].trim().split('\n').pop() || match[0].trim() // Try to get just the declaration line
                });
            }
        }
        return symbols;
    }

    /**
     * Index the codebase to build the Knowledge Graph and Vector Store.
     * 1. Updates File nodes.
     * 2. Extracts and embeds Symbols for fine-grained RAG.
     * 3. Maps dependencies via imports.
     */
    public async syncCodebase(files: GeneratedFile[]) {
        if (!this.settings.memory.enabled) return;
        
        try {
            for (const file of files) {
                // 1. Upsert File Node
                await dbCore.query(`UPDATE type::thing('files', $name) CONTENT { name: $name, content: $content }`, { name: file.name, content: file.content });
                
                // 2. Smart Indexing: Extract and Embed Symbols
                const symbols = this.extractSymbols(file.content);
                for (const sym of symbols) {
                    const textToEmbed = `File: ${file.name}\nSymbol: ${sym.name} (${sym.type})\nDoc: ${sym.doc}\nSignature: ${sym.signature}`;
                    const embedding = await this.getEmbedding(textToEmbed);
                    
                    if (embedding.length > 0) {
                         const symbolId = `sym_${file.name.replace(/\W/g, '_')}_${sym.name}`;
                         await dbCore.query(`
                            UPDATE type::thing('symbols', $id) CONTENT {
                                name: $name,
                                file: $file,
                                type: $type,
                                doc: $doc,
                                signature: $signature,
                                embedding: $embedding
                            };
                            RELATE type::thing('files', $file)->defines->type::thing('symbols', $id);
                        `, { 
                            id: symbolId,
                            name: sym.name,
                            file: file.name,
                            type: sym.type,
                            doc: sym.doc,
                            signature: sym.signature,
                            embedding
                        });
                    }
                }

                // 3. Graph: Parse Imports
                const imports = this.extractImports(file);
                for (const imp of imports) {
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
        const regex = /import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|@import\s+['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = regex.exec(file.content)) !== null) {
            let path = match[1] || match[2];
            if (!path) continue;
            path = path.replace(/^\.\//, ''); 
            if (path.startsWith('.') || path.includes('/')) {
                if (!path.includes('.')) path = path + '.tsx';
                imports.add(path);
            }
        }
        return Array.from(imports);
    }

    /**
     * High Precision Context Extraction.
     * Searches both Code Symbols (Metadata) and Past Interactions (Memories).
     */
    async retrieveContext(query: string): Promise<string> {
        if (!this.settings.memory.enabled) return "";

        const startTime = performance.now();
        const vector = await this.getEmbedding(query);
        if (vector.length === 0) return "";

        try {
            // Dual Query: 
            // 1. Search specific code symbols (Functions/Classes)
            // 2. Search past interactions/memories
            const [symbolResults, memoryResults] = await Promise.all([
                dbCore.query<any>(`
                    SELECT 
                        name, file, doc, signature,
                        vector::similarity::cosine(embedding, $vector) as score
                    FROM symbols
                    WHERE embedding IS NOT NONE
                    ORDER BY score DESC
                    LIMIT 3
                `, { vector }),
                dbCore.query<any>(`
                    SELECT 
                        content,
                        vector::similarity::cosine(embedding, $vector) as score,
                        (
                            SELECT name, content FROM ->modified->files
                        ) as related_code
                    FROM memories 
                    WHERE embedding IS NOT NONE
                    ORDER BY score DESC
                    LIMIT 2
                `, { vector })
            ]);
            
            const endTime = performance.now();
            
            // Telemetry: Log RAG Performance
            logger.info(AppModule.CORE, `RAG Retrieval Perf: ${Math.round(endTime - startTime)}ms`, {
                telemetryId: this.settings.telemetryId,
                latencyMs: endTime - startTime,
                queryLength: query.length,
                symbolsFound: symbolResults.length,
                memoriesFound: memoryResults.length
            });
            
            if (symbolResults.length === 0 && memoryResults.length === 0) return "";

            const contextParts: string[] = [];

            // Format Symbols
            if (symbolResults.length > 0) {
                const symbols = symbolResults.map(s => ({
                    symbol: s.name,
                    file: s.file,
                    type: s.type,
                    description: s.doc || "No docstring",
                    signature: s.signature
                }));
                contextParts.push(`[Codebase Symbols (Smart Index)]:\n${JSON.stringify(symbols, null, 2)}`);
            }

            // Format Memories
            if (memoryResults.length > 0) {
                 const memories = memoryResults.map(m => ({
                    memory: m.content,
                    related_files: m.related_code?.map((f:any) => f.name) || []
                 }));
                 contextParts.push(`[Past Interactions]:\n${JSON.stringify(memories, null, 2)}`);
            }

            return contextParts.join("\n\n");

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
