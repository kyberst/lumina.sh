import { Surreal } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';

/**
 * DBCore: Wrapper for SurrealDB Embedded (WASM/IndexedDB).
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
      // Initialize Surreal with WebAssembly Engines to support embedded protocols (indb, mem)
      this.db = new Surreal({
        engines: surrealdbWasmEngines(),
      });
      
      try {
          // Try persistence via IndexedDB
          await this.db.connect('indb://lumina');
          logger.info(AppModule.CORE, 'SurrealDB Connected (IndexedDB)');
      } catch (indbError) {
          console.warn("IndexedDB persistence failed, falling back to Memory", indbError);
          // Fallback to in-memory if IndexedDB fails (common in some iframe/sandboxed envs)
          await this.db.connect('mem://lumina');
          logger.info(AppModule.CORE, 'SurrealDB Connected (Memory)');
      }
      
      // Select Namespace/Database
      await this.db.use({ namespace: 'lumina', database: 'lumina' });

      // Run Schema Migrations (Define Tables/Indexes)
      await runMigrations(this);
      
      this.isReady = true;
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
        // SurrealDB returns an array of results, one for each statement.
        if (Array.isArray(result) && result[0]) {
             // Handle different result formats from different SDK versions
             if (typeof result[0] === 'object' && result[0] !== null && 'result' in result[0]) {
                 return (result[0] as any).result || [];
             }
             return result[0] as any; 
        }
        return result as any;
    } catch (e: any) {
        logger.error(AppModule.CORE, `Query Failed: ${sql}`, e);
        throw e;
    }
  }
}

export const dbCore = DBCore.getInstance();