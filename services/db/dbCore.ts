
import { Surreal } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';
import { createAppTables } from './schema/appSchema';
import { createGraphTables } from './schema/graphSchema';

/**
 * DBCore: Wrapper for SurrealDB.
 * Orchestrates connection and schema initialization for both linear and graph data.
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
      this.db = new Surreal({ engines: surrealdbWasmEngines() });
      await this.db.connect("indxdb://lumina");
      
      await this.db.use({ namespace: 'lumina', database: 'lumina' });
      
      // Atomic Table Definitions
      await createAppTables(this);
      await createGraphTables(this);

      await runMigrations(this);
      this.isReady = true;
      logger.info(AppModule.CORE, 'SurrealDB Graph & Vector Core Ready');
      
    } catch (e: any) {
      logger.error(AppModule.CORE, 'DB Init Failed', e);
      throw e;
    }
  }

  public async query<T = any>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    if (!this.db) throw new Error("DB not initialized");
    const result = await this.db.query(sql, params);
    
    // Handle Array response (standard)
    if (Array.isArray(result)) {
         const first = result[0] as any;
         if (first && typeof first === 'object' && 'result' in first) {
             if (first.status === 'ERR') throw new Error(String(first.result));
             return Array.isArray(first.result) ? first.result : [first.result];
         }
         // Fallback for empty array or unknown structure inside array
         return [];
    }
    
    // Handle potential single object response (edge case in some drivers/versions)
    const resObj = result as any;
    if (resObj && typeof resObj === 'object' && 'result' in resObj) {
         if (resObj.status === 'ERR') throw new Error(String(resObj.result));
         return Array.isArray(resObj.result) ? resObj.result : [resObj.result];
    }

    return [];
  }

  public async executeTransaction(ops: { query: string, params?: Record<string, any> }[]) {
    if (!this.db) throw new Error("DB not initialized");
    const statements = ["BEGIN TRANSACTION"];
    const globalParams: Record<string, any> = {};
    ops.forEach((op, i) => {
      let sql = op.query;
      if (op.params) {
        for (const [key, val] of Object.entries(op.params)) {
          const uKey = `${key}_tx${i}`;
          sql = sql.replace(new RegExp(`\\$${key}\\b`, 'g'), `$${uKey}`);
          globalParams[uKey] = val;
        }
      }
      statements.push(sql);
    });
    statements.push("COMMIT TRANSACTION");
    return await this.db.query(statements.join(';\n'), globalParams);
  }
}

export const dbCore = DBCore.getInstance();
