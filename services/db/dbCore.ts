
import { Surreal } from 'surrealdb';
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';

/**
 * MockDatabase: A lightweight fallback for environments where SurrealDB WASM is unavailable.
 * Persists data to localStorage to maintain application state.
 */
class MockDatabase {
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
        // Pattern: UPDATE type::thing('table', $id_param OR 'literal_id') CONTENT $obj
        if (cleanSql.toUpperCase().startsWith('UPDATE')) {
            const match = cleanSql.match(/type::thing\(['"](\w+)['"],\s*(?:\$([\w]+)|['"]([\w-]+)['"])\)/);
            if (match) {
                const table = match[1];
                const id = match[2] ? params[match[2]] : match[3];
                
                // Extract content
                let content = {};
                // Handle: CONTENT { value: $v, ... }
                if (cleanSql.includes('CONTENT {')) {
                     // Very basic parser for the specific config/version query
                     if (cleanSql.includes('value: $v')) content = { value: params.v, timestamp: Date.now() };
                     // Handle memory upsert
                     else if (cleanSql.includes('embedding: $vector')) content = { embedding: params.vector, content: params.content, timestamp: Date.now() };
                     // Handle file upsert
                     else if (cleanSql.includes('name: $name')) content = { name: params.name, content: params.content };
                } else {
                    // Handle: CONTENT $param
                    const contentMatch = cleanSql.match(/CONTENT\s+\$(\w+)/);
                    if (contentMatch) content = params[contentMatch[1]];
                }

                if (!this.data[table]) this.data[table] = {};
                this.data[table][id] = { ...this.data[table][id], ...content, id };
                this.persist();
                
                // If it's a file, we can fake the RELATE logic by ignoring it or logging
                return [];
            }
        }

        // 2. SELECT
        if (cleanSql.toUpperCase().startsWith('SELECT')) {
            // Pattern: FROM table OR FROM table:id
            const match = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)(?::([\w-]+))?/); 
            const table = match ? match[1] : null;
            
            if (table && this.data[table]) {
                let results = Object.values(this.data[table]);
                
                // Direct ID selection from FROM clause (e.g. app_config:db_version)
                if (match && match[2]) {
                     const item = this.data[table][match[2]];
                     return item ? [item] : [];
                }

                // WHERE clause
                const whereMatch = cleanSql.match(/WHERE\s+(\w+)\s*=\s*(?:<string>)?\$(\w+)/);
                if (whereMatch) {
                    const field = whereMatch[1];
                    const paramName = whereMatch[2];
                    const val = params[paramName];
                    results = results.filter(r => r[field] === val);
                }
                
                // ORDER BY (Simple timestamp desc)
                if (cleanSql.includes('ORDER BY timestamp DESC')) {
                    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                }
                
                // Return wrapped in array as SurrealDB client usually returns [result]
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
        
        // 4. GRAPH (RELATE) - Ignore in mock
        if (cleanSql.toUpperCase().startsWith('RELATE')) {
            return [];
        }
        
        // 5. DEFINE/CREATE (Schema) - Ignore
        if (cleanSql.toUpperCase().startsWith('DEFINE') || cleanSql.toUpperCase().startsWith('CREATE')) {
            return [];
        }

        return [];
    }
}

/**
 * DBCore: Wrapper for SurrealDB.
 * Handles database connection and raw query execution.
 */
class DBCore {
  private db: Surreal | null = null;
  private static instance: DBCore;
  public isReady = false;

  public static getInstance(): DBCore {
    if (!DBCore.instance) DBCore.instance = new DBCore();
    return DBCore.instance;
  }

  public async init(): Promise<void> {
    if (this.isReady) return;
    try {
      this.db = new Surreal();
      
      try {
          // Attempt standard connection. 
          // Without @surrealdb/wasm, 'indb://' and 'mem://' will likely fail.
          await this.db.connect('indb://lumina');
          logger.info(AppModule.CORE, 'SurrealDB Connected (IndexedDB)');
      } catch (indbError) {
          console.warn("DB Connection failed (Missing WASM?), falling back to MockDB", indbError);
          // FALLBACK: Use MockDatabase backed by localStorage
          // This ensures the app works without the WASM binary
          this.db = new MockDatabase() as any;
          await this.db!.connect('mock://local');
      }
      
      // Select Namespace/Database (MockDB accepts this)
      try {
          await this.db!.use({ namespace: 'lumina', database: 'lumina' });
          
          // Run Versioned Schema Migrations
          logger.info(AppModule.CORE, 'Checking DB Schema Versions...');
          await runMigrations(this);
          
          this.isReady = true;
      } catch (e) {
          console.error("Failed to select DB or run migrations.", e);
          // If migrations fail, we might still be in a usable state for MockDB
          if (this.db instanceof MockDatabase) this.isReady = true; 
      }
      
    } catch (e: any) {
      logger.error(AppModule.CORE, 'DB Init Failed', e);
      throw e;
    }
  }

  /**
   * Execute a SurrealQL query.
   */
  public async query<T = any>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    if (!this.db) throw new Error("DB not initialized");
    try {
        const result = await this.db.query(sql, params);
        // Handle SurrealDB response format (array of results)
        if (Array.isArray(result)) {
             // MockDB returns direct arrays, Surreal returns objects with { result: ... }
             // Check if result[0] wraps the actual data
             if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'result' in result[0]) {
                 return (result[0] as any).result || [];
             }
             // If result is just the array of data (MockDB behavior or specific query types)
             return result as T[];
        }
        return result as any;
    } catch (e: any) {
        logger.error(AppModule.CORE, `Query Failed: ${sql.substring(0, 100)}...`, e);
        throw e;
    }
  }

  /**
   * Execute a batch of queries as an atomic ACID transaction.
   * Handles parameter scoping to prevent collisions between batched operations.
   */
  public async executeTransaction(ops: { query: string, params?: Record<string, any> }[]) {
    if (!this.db) throw new Error("DB not initialized");

    // For MockDB, we just execute sequentially as it doesn't support transactions
    // For Real DB, we wrap in TRANSACTION block
    const isMock = (this.db as any).constructor.name === 'MockDatabase';

    if (isMock) {
        const results = [];
        for (const op of ops) {
            results.push(await this.query(op.query, op.params));
        }
        return results;
    }

    const statements: string[] = ["BEGIN TRANSACTION"];
    const globalParams: Record<string, any> = {};

    ops.forEach((op, i) => {
      let sql = op.query;
      if (op.params) {
        for (const [key, val] of Object.entries(op.params)) {
          const uniqueKey = `${key}_tx${i}`;
          sql = sql.replace(new RegExp(`\\$${key}\\b`, 'g'), `$${uniqueKey}`);
          globalParams[uniqueKey] = val;
        }
      }
      statements.push(sql);
    });

    statements.push("COMMIT TRANSACTION");
    const finalSql = statements.join(';\n');

    return await this.db.query(finalSql, globalParams);
  }
}

export const dbCore = DBCore.getInstance();
