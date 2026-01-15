
import { dbCore } from '../db/dbCore';
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from '../../types';

export class GraphService {
    private static instance: GraphService;
    public static getInstance() {
        if (!GraphService.instance) GraphService.instance = new GraphService();
        return GraphService.instance;
    }

    /**
     * Identifies entities mentioned in the chat prompt using Gemini and 
     * cross-references them with existing graph nodes for contextual RAG.
     */
    public async extractEntitiesFromChat(projectId: string, prompt: string) {
        // Fix: Added missing method required by useRefactorStream.ts
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        try {
            // Get existing nodes for context to help the model identify matches
            const nodes = await dbCore.query(`SELECT name FROM graph_nodes WHERE project_id = $pid`, { pid: projectId });
            if (nodes.length === 0) return;

            const nodeNames = nodes.map((n: any) => n.name).join(', ');

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Identify which of the following project entities (files/features) are mentioned or highly relevant to the user prompt.
                
                Available Entities: ${nodeNames}
                User Command: "${prompt}"
                
                Return a JSON array containing ONLY the exact names of the matched entities.`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            // The .text property is used directly as per GenAI SDK guidelines
            const identifiedNames = JSON.parse(response.text || '[]');
            // Future implementation will RELATE these nodes to the chat history record
            console.debug(`[GraphService] Extracted entities: ${identifiedNames.join(', ')}`);
        } catch (e) {
            console.warn("Graph entity extraction failed", e);
        }
    }

    /** Travesía de Topología: Nivel 1 (Full) y Nivel 2 (Skeleton) */
    public async getHierarchicalMap(projectId: string, targetFile: string) {
        // Nivel 1: Dependencias directas
        const level1 = await dbCore.query(`
            SELECT out.name AS name, out.content AS content 
            FROM imports WHERE in.project_id = $pid AND in.name = $target
        `, { pid: projectId, target: targetFile });

        // Nivel 2: Dependencias de dependencias
        const level2 = await dbCore.query(`
            SELECT out.name AS name, out.content AS content 
            FROM imports WHERE in.project_id = $pid 
            AND in.name IN (SELECT out.name FROM imports WHERE in.name = $target)
        `, { pid: projectId, target: targetFile });

        return {
            direct: level1,
            transitive: level2.map((f: any) => ({
                name: f.name,
                skeleton: this.summarizeSkeleton(f.content)
            }))
        };
    }

    /** Extrae firmas y tipos, omitiendo implementaciones */
    private summarizeSkeleton(content: string): string {
        if (!content) return "";
        // Elimina cuerpos de funciones preservando la firma
        return content
            .replace(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, '{ /* implementation hidden */ }')
            .replace(/import\s+.*?;/g, '') // Remueve imports internos para limpiar
            .split('\n')
            .filter(line => line.trim().length > 0)
            .join('\n');
    }

    public async analyzeProjectTopology(projectId: string, files: GeneratedFile[]) {
        const ops = [];
        // Limpiar grafo previo del archivo
        ops.push({ query: `DELETE graph_nodes WHERE project_id = $pid`, params: { pid: projectId } });
        
        for (const file of files) {
            ops.push({ 
                query: `CREATE graph_nodes SET project_id = $pid, name = $n, kind = 'file', content = $c`,
                params: { pid: projectId, n: file.name, c: file.content }
            });
        }
        
        // Crear relaciones de importación basadas en estática
        for (const file of files) {
            const matches = file.content.matchAll(/from\s+['"]\.\/(.*?)['"]/g);
            for (const match of matches) {
                const depName = match[1].includes('.') ? match[1] : `${match[1]}.ts`; 
                ops.push({
                    query: `RELATE (SELECT * FROM graph_nodes WHERE name = $in_n AND project_id = $pid) -> imports -> (SELECT * FROM graph_nodes WHERE name = $out_n AND project_id = $pid)`,
                    params: { in_n: file.name, out_n: depName, pid: projectId }
                });
            }
        }
        await dbCore.executeTransaction(ops);
    }
}
export const graphService = GraphService.getInstance();
