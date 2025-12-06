
import { logger } from '../logger';
import { AppModule } from '../../types';
import { runMigrations } from './migrations';
import { taskService } from '../taskService';

const DB_NAME = 'umbra_dyad.sqlite';

/**
 * DBCore: Low-level wrapper for SQL.js (WASM) and IndexedDB.
 * Handles database initialization, raw query execution, and binary persistence.
 */
class DBCore {
  private db: any = null;
  private static instance: DBCore;
  public isReady = false;

  public static getInstance(): DBCore {
    if (!DBCore.instance) DBCore.instance = new DBCore();
    return DBCore.instance;
  }

  /**
   * Initialize SQL.js and load binary from IndexedDB.
   */
  public async init(): Promise<void> {
    if (this.isReady) return;
    try {
      if (!(window as any).initSqlJs) throw new Error("SQL.js not loaded");

      // Load SQL.js WASM from CDN
      const SQL = await (window as any).initSqlJs({
        locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`
      });

      // Retrieve persisted binary
      const data = await this.loadFromIDB();
      this.db = data ? new SQL.Database(new Uint8Array(data)) : new SQL.Database();

      // Run Schema Migrations
      runMigrations(this.db, !!data);
      this.isReady = true;
      this.persist(); // Ensure initial structure is saved
    } catch (e: any) {
      logger.error(AppModule.CORE, 'DB Init Failed', e);
      throw e;
    }
  }

  /**
   * Execute a SQL query and return formatted results.
   */
  public exec(sql: string, params: any[] = []): any[] {
    if (!this.db) return [];
    return this.db.exec(sql, params);
  }

  /**
   * Run a SQL command (Insert/Update/Delete) and trigger persistence.
   */
  public run(sql: string, params: any[] = []) {
    if (!this.db) return;
    this.db.run(sql, params);
    this.persist();
  }

  /**
   * Load binary buffer from browser's IndexedDB.
   */
  private loadFromIDB(): Promise<ArrayBuffer | null> {
    return new Promise((res) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = (e: any) => e.target.result.createObjectStore('store');
      r.onsuccess = (e: any) => {
        const tx = e.target.result.transaction('store', 'readonly');
        const req = tx.objectStore('store').get('db_file');
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      };
    });
  }

  /**
   * Queue a background task to save the DB binary to IndexedDB.
   */
  private persist() {
    if (!this.db) return;
    
    // Offload to TaskService to prevent UI blocking
    taskService.addTask("Saving DB", async () => {
      const data = this.db.export();
      return new Promise((resolve, reject) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onerror = (e) => reject(e);
        r.onsuccess = (e: any) => {
          const tx = e.target.result.transaction('store', 'readwrite');
          const req = tx.objectStore('store').put(data, 'db_file');
          req.onsuccess = () => resolve(true);
          req.onerror = (err: any) => reject(err);
        };
      });
    });
  }
}

export const dbCore = DBCore.getInstance();
