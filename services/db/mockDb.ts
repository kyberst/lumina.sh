
/**
 * MockDatabase: A lightweight fallback for environments where SurrealDB WASM is unavailable.
 * Persists data to localStorage to maintain application state.
 */
export class MockDatabase {
    private data: Record<string, Record<string, any>> = {
        users: {}, projects: {}, sessions: {}, transactions: {}, chat_history: {}, refactor_history: {}, app_config: {}, memories: {}, files: {}, symbols: {}
    };

    constructor() {
        try {
            const saved = localStorage.getItem('lumina_mock_db');
            if (saved) {
                this.data = { ...this.data, ...JSON.parse(saved) };
            }
        } catch (e) { console.error("Failed to load mock DB", e); }
    }

    private persist() {
        try { localStorage.setItem('lumina_mock_db', JSON.stringify(this.data)); } catch (e) {}
    }

    async connect(url: string) { console.warn(`[MockDB] Connected to ${url} (LocalStorage Mode)`); return true; }
    async use(cfg: any) { return true; }

    async query(sql: string, params: any = {}) {
        const cleanSql = sql.trim();
        
        // 1. UPDATE / INSERT (Upsert)
        if (cleanSql.toUpperCase().startsWith('UPDATE')) {
            const match = cleanSql.match(/type::thing\(['"](\w+)['"],\s*(?:\$([\w]+)|['"]([\w-]+)['"])\)/);
            if (match) {
                const table = match[1];
                const id = match[2] ? params[match[2]] : match[3];
                let content = {};
                if (cleanSql.includes('CONTENT {')) {
                     if (cleanSql.includes('value: $v')) content = { value: params.v, timestamp: Date.now() };
                     else if (cleanSql.includes('embedding: $vector')) content = { embedding: params.vector, content: params.content, timestamp: Date.now() };
                     else if (cleanSql.includes('name: $name')) content = { name: params.name, content: params.content };
                } else {
                    const contentMatch = cleanSql.match(/CONTENT\s+\$(\w+)/);
                    if (contentMatch) content = params[contentMatch[1]];
                }
                if (!this.data[table]) this.data[table] = {};
                this.data[table][id] = { ...this.data[table][id], ...content, id };
                this.persist();
                return [];
            }
        }

        // 2. SELECT
        if (cleanSql.toUpperCase().startsWith('SELECT')) {
            const match = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)(?::([\w-]+))?/); 
            const table = match ? match[1] : null;
            if (table && this.data[table]) {
                let results = Object.values(this.data[table]);
                if (match && match[2]) {
                     const item = this.data[table][match[2]];
                     return item ? [item] : [];
                }
                const whereMatch = cleanSql.match(/WHERE\s+(\w+)\s*=\s*(?:<string>)?\$(\w+)/);
                if (whereMatch) {
                    const field = whereMatch[1];
                    const val = params[whereMatch[2]];
                    results = results.filter(r => r[field] === val);
                }
                if (cleanSql.includes('ORDER BY timestamp DESC')) {
                    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                }
                return results;
            }
            return [];
        }

        // 3. DELETE
        if (cleanSql.toUpperCase().startsWith('DELETE')) {
             const match = cleanSql.match(/type::thing\(['"](\w+)['"],\s*\$(\w+)\)/);
             if (match) {
                 const table = match[1];
                 const id = params[match[2]];
                 if (this.data[table]) delete this.data[table][id];
                 this.persist();
                 return [];
             }
        }
        return [];
    }
}
