
import { Surreal } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';

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
      // Per official documentation, initialize with WASM engines.
      this.db = new Surreal({
        engines: surrealdbWasmEngines(),
      });
      
      await this.db.connect('indxdb://demo');
      logger.info(AppModule.CORE, 'SurrealDB Connected (IndexedDB)');
      
      await this.db.use({ namespace: 'demo', database: 'demo' });
      logger.info(AppModule.CORE, 'Checking DB Schema Versions...');
      await runMigrations(this);
      this.isReady = true;
      
    } catch (e: any) {
      logger.error(AppModule.CORE, 'DB Init Failed', e);
      throw e;
    }
  }

  public async query<T = any>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    if (!this.db) throw new Error("DB not initialized");
    try {
        const result = await this.db.query(sql, params);
        if (Array.isArray(result)) {
             if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'result' in result[0]) {
                 return (result[0] as any).result || [];
             }
             return result as T[];
        }
        return result as any;
    } catch (e: any) {
        logger.error(AppModule.CORE, `Query Failed: ${sql.substring(0, 100)}...`, e);
        throw e;
    }
  }

  public async executeTransaction(ops: { query: string, params?: Record<string, any> }[]) {
    if (!this.db) throw new Error("DB not initialized");

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