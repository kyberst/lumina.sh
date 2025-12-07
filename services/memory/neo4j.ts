
import { MemorySettings } from "../../types";
import { logger } from "../logger";
import { AppModule } from "../../types";

export class Neo4jService {
    constructor(private settings: MemorySettings) {}

    private getHeaders() {
        const headers: any = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (this.settings.neo4jUser && this.settings.neo4jPass) {
            headers['Authorization'] = 'Basic ' + btoa(`${this.settings.neo4jUser}:${this.settings.neo4jPass}`);
        }
        return headers;
    }

    async execute(cypher: string, params: any = {}) {
        if (!this.settings.enabled) return null;
        try {
            // Ensure we are hitting the transaction endpoint
            // If user provided base url like http://localhost:7474, append endpoint
            let url = this.settings.neo4jUrl;
            if (!url.includes('/db/')) {
                 url = url.replace(/\/$/, '') + '/db/neo4j/tx/commit';
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    statements: [{ statement: cypher, parameters: params }]
                })
            });

            if (!res.ok) {
                const txt = await res.text();
                logger.warn(AppModule.CORE, `Neo4j Error: ${txt}`);
                return null;
            }
            return await res.json();
        } catch (e) {
            logger.error(AppModule.CORE, "Neo4j connection failed", e);
            return null;
        }
    }

    async saveInteraction(sessionId: string, userText: string, aiResponse: string, filesTouched: string[]) {
        const cypher = `
            MERGE (s:Session {id: $sessionId})
            CREATE (u:Message {text: $userText, type: 'user', timestamp: timestamp()})
            CREATE (a:Message {text: $aiResponse, type: 'ai', timestamp: timestamp()})
            MERGE (s)-[:HAS_MESSAGE]->(u)
            MERGE (u)-[:NEXT]->(a)
            FOREACH (fName IN $files | 
                MERGE (f:File {name: fName})
                MERGE (a)-[:MODIFIED]->(f)
            )
        `;
        await this.execute(cypher, { sessionId, userText, aiResponse, files: filesTouched });
    }

    async getRelatedContext(text: string): Promise<string[]> {
        // Simple search: Find messages that touched similar files or contain keywords
        // For simplicity in this demo, we return recent file modifications
        const cypher = `
            MATCH (m:Message)-[:MODIFIED]->(f:File)
            WITH f, count(m) as mods
            ORDER BY mods DESC LIMIT 5
            RETURN f.name as filename
        `;
        const res = await this.execute(cypher);
        if (!res || !res.results || !res.results[0]) return [];
        
        const files = res.results[0].data.map((row: any) => row.row[0]);
        return files.length > 0 ? [`Relevant Graph Knowledge: Frequently modified files: ${files.join(', ')}`] : [];
    }
}
