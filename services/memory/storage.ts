import { GeneratedFile, ChatMessage } from "../../types";
import { dbCore } from "../db/dbCore";
import { logger } from "../logger";
import { AppModule } from "../../types";
import { extractSymbols, extractImports } from "./analysis";

export const syncCodebase = async (files: GeneratedFile[], getEmbeddingFn: (t: string) => Promise<number[]>) => {
    try {
        for (const file of files) {
            // 1. Upsert File Node
            await dbCore.query(`UPDATE type::thing('files', $name) CONTENT { name: $name, content: $content }`, { name: file.name, content: file.content });
            
            // 2. Smart Indexing
            const symbols = extractSymbols(file.content);
            for (const sym of symbols) {
                const textToEmbed = `File: ${file.name}\nSymbol: ${sym.name} (${sym.type})\nDoc: ${sym.doc}\nSignature: ${sym.signature}`;
                const embedding = await getEmbeddingFn(textToEmbed);
                
                if (embedding.length > 0) {
                        const symbolId = `sym_${file.name.replace(/\W/g, '_')}_${sym.name}`;
                        await dbCore.query(`
                        UPDATE type::thing('symbols', $id) CONTENT {
                            name: $name, file: $file, type: $type, doc: $doc, signature: $signature, embedding: $embedding
                        };
                        RELATE type::thing('files', $file)->defines->type::thing('symbols', $id);
                    `, { 
                        id: symbolId, name: sym.name, file: file.name, type: sym.type, doc: sym.doc, signature: sym.signature, embedding
                    });
                }
            }

            // 3. Graph Relationships
            const imports = extractImports(file);
            for (const imp of imports) {
                    await dbCore.query(`RELATE type::thing('files', $src)->imports->type::thing('files', $target)`, { src: file.name, target: imp });
            }
        }
    } catch (e) {
        logger.warn(AppModule.CORE, "Failed to sync codebase graph", e);
    }
};

export const saveInteraction = async (entry: ChatMessage, responseText: string, modifiedFiles: string[], getEmbeddingFn: (t: string) => Promise<number[]>) => {
    const content = `User: ${entry.text}\nAI: ${responseText.slice(0, 500)}`;
    const vector = await getEmbeddingFn(entry.text);
    
    if (vector.length > 0) {
        try {
            const memoryId = entry.id;
            await dbCore.query(`
                UPDATE type::thing('memories', $id) CONTENT {
                    embedding: $vector, content: $content, timestamp: time::now()
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
};
