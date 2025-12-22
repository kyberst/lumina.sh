
import { Surreal } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';
import { createAppTables } from './schema/appSchema';

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
      this.db = new Surreal({
        engines: surrealdbWasmEngines(),
      });
      
      await this.db.connect("indxdb://lumina");
      logger.info(AppModule.CORE, 'SurrealDB Connected (IndexedDB via WASM)');
      
      // Select Namespace/Database
      try {
          await this.db.use({ namespace: 'lumina', database: 'lumina' });
          
          // CRITICAL FIX: Define all tables BEFORE attempting any reads.
          logger.info(AppModule.CORE, 'Defining core application schema...');
          await createAppTables(this);

          // Run Versioned Schema Migrations
          logger.info(AppModule.CORE, 'Checking DB Schema Versions...');
          await runMigrations(this);
          
          this.isReady = true;
      } catch (e) {
          logger.error(AppModule.CORE, "Failed to select DB or run migrations.", e);
          throw e; // Critical error, stop app initialization
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
        
        // Handle SurrealDB response format (array of results for multiple statements)
        if (Array.isArray(result)) {
             // For a single statement query, result is [{ result: [...], status: "OK", time: "..." }]
             // We need to check the first element.
             const first = result[0];
             if (first && typeof first === 'object' && 'result' in first && 'status' in first) {
                 if (first.status === 'ERR') {
                     throw new Error(`SurrealDB Query Error: ${first.result}`);
                 }
                 const data = first.result;
                 return Array.isArray(data) ? data : (data ? [data] : []);
             }
             // If it's not the wrapped format, return as is.
             return result as T[];
        }
        
        // Single object result (rare in some drivers but possible)
        if (result && typeof result === 'object' && 'result' in (result as any)) {
            const data = (result as any).result;
            return Array.isArray(data) ? data : (data ? [data] : []);
        }

        return [];
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

    const statements: string[] = ["BEGIN TRANSACTION"];
    const globalParams: Record<string, any> = {};

    ops.forEach((op, i) => {
      let sql = op.query;
      if (op.params) {
        for (const [key, val] of Object.entries(op.params)) {
          const uniqueKey = `${key}_tx${i}`;
          // Use word boundary to avoid partial replacements (e.g. $id vs $id_2)
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
