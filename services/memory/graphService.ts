
import { dbCore } from '../db/dbCore';
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from '../../types';

/**
 * GraphService: Manages the Semantic Knowledge Graph.
 * Transitions from plain-text history to a web of persistent architectural decisions.
 */
export class GraphService {
    private static instance: GraphService;

    public static getInstance() {
        if (!GraphService.instance) GraphService.instance = new GraphService();
        return GraphService.instance;
    }

    /** Analyzes codebase to build the initial structural graph */
    public async analyzeProjectTopology(projectId: string, files: GeneratedFile[]) {
        if (!process.env.API_KEY || files.length === 0) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const ctx = files.map(f => `${f.name}: ${f.content.substring(0, 300)}`).join('\n---\n');
        const prompt = `Map the architecture of this project. Identify features, tech stack, and dependencies.
        Return JSON: { nodes: [{name, kind, summary}], edges: [{from, to}] }`;

        try {
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt + "\n\n" + ctx,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, kind: {type: Type.STRING}, summary: {type: Type.STRING} } } },
                            edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { from: {type: Type.STRING}, to: {type: Type.STRING} } } }
                        }
                    }
                }
            });

            const data = JSON.parse(res.text || '{}');
            await this.persistTopology(projectId, data, false);
        } catch (e) { console.warn("Graph topology analysis failed", e); }
    }

    /** Extracts persistent "memories" (decisions) from chat turns */
    public async extractEntitiesFromChat(projectId: string, userPrompt: string) {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `Extract technical requirements or UI preferences from this message.
        Example: "Use blue background" -> Node {name: "UI_BG_COLOR", kind: "preference", summary: "Blue"}
        Message: "${userPrompt}"
        Output JSON: { nodes: [{name, kind: 'preference'|'requirement', summary}] }`;

        try {
            const res = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, kind: {type: Type.STRING}, summary: {type: Type.STRING} } } }
                        }
                    }
                }
            });

            const data = JSON.parse(res.text || '{}');
            if (data.nodes?.length) await this.persistTopology(projectId, data, true);
        } catch (e) { console.warn("Chat entity extraction failed", e); }
    }

    private async persistTopology(projectId: string, data: any, merge: boolean) {
        if (!data.nodes) return;
        const ops = [];
        
        if (!merge) {
            ops.push({ query: `DELETE graph_nodes WHERE project_id = $pid AND kind NOT IN ['preference', 'requirement']`, params: { pid: projectId } });
        }

        for (const node of data.nodes) {
            const query = merge 
                ? `UPSERT graph_nodes SET summary = $s, kind = $k WHERE project_id = $pid AND name = $n`
                : `CREATE graph_nodes SET project_id = $pid, name = $n, kind = $k, summary = $s`;
            
            ops.push({ query, params: { pid: projectId, n: node.name, k: node.kind, s: node.summary } });
        }

        await dbCore.executeTransaction(ops);
    }

    /** Context-aware retrieval of graph nodes */
    public async getRelevantContext(projectId: string, query: string): Promise<string[]> {
        const results = await dbCore.query(`
            SELECT summary, name, kind FROM graph_nodes 
            WHERE project_id = $pid AND (name ~ $q OR summary ~ $q OR kind ~ $q)
            ORDER BY kind = 'preference' DESC, kind = 'requirement' DESC
        `, { pid: projectId, q: query });
        
        return results.map((r: any) => `[GRAPH_NODE] ${r.kind.toUpperCase()}: ${r.name} -> ${r.summary}`);
    }
}

export const graphService = GraphService.getInstance();
