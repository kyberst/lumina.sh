import { AppError, AppModule, JournalEntry, ChatMessage, User, Transaction } from '../types';
import { logger } from './logger';
import { runMigrations } from './db/migrations';

const DB_NAME = 'umbra_dyad.sqlite';

/**
 * Service to handle client-side persistence using SQL.js (WASM).
 * Data is persisted to IndexedDB to survive page reloads.
 */
class SqliteService {
  private db: any = null;
  private static instance: SqliteService;
  private isReady = false;

  public static getInstance(): SqliteService { if (!SqliteService.instance) SqliteService.instance = new SqliteService(); return SqliteService.instance; }

  /** Initialize the WASM database and load data from IndexedDB */
  public async init(): Promise<void> {
    if (this.isReady) return;
    try {
        if (!(window as any).initSqlJs) throw new Error("SQL.js not loaded");
        const SQL = await (window as any).initSqlJs({ locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
        const data = await this.loadFromIDB();
        this.db = data ? new SQL.Database(new Uint8Array(data)) : new SQL.Database();
        runMigrations(this.db, !!data);
        this.isReady = true;
        this.saveToIDB();
    } catch (e: any) { logger.error(AppModule.CORE, 'Init Failed', e); }
  }

  // --- IndexedDB Persistence Helpers ---
  private loadFromIDB(): Promise<ArrayBuffer | null> {
      return new Promise((res) => {
          const r = indexedDB.open(DB_NAME, 1);
          r.onupgradeneeded = (e: any) => e.target.result.createObjectStore('store');
          r.onsuccess = (e: any) => { const req = e.target.result.transaction('store', 'readonly').objectStore('store').get('db_file'); req.onsuccess = () => res(req.result || null); };
      });
  }

  private saveToIDB() {
      if (!this.db) return;
      const d = this.db.export();
      const r = indexedDB.open(DB_NAME, 1);
      r.onsuccess = (e: any) => e.target.result.transaction('store', 'readwrite').objectStore('store').put(d, 'db_file');
  }

  // --- User Operations ---
  public async getUser(email: string): Promise<User | null> {
      const r = this.db?.exec("SELECT * FROM users WHERE email = ?", [email]);
      if (!r?.length) return null;
      const u = this.mapRow(r[0].columns, r[0].values[0]);
      return { ...u, twoFactorEnabled: !!u.twoFactorEnabled } as User;
  }
  
  public async getUserById(id: string): Promise<User | null> {
      const r = this.db?.exec("SELECT * FROM users WHERE id = ?", [id]);
      if (!r?.length) return null;
      const u = this.mapRow(r[0].columns, r[0].values[0]);
      return { ...u, twoFactorEnabled: !!u.twoFactorEnabled } as User;
  }

  public async createUser(u: User) {
      this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [u.id, u.email, u.name, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled?1:0, u.createdAt]);
      this.saveToIDB();
  }
  
  public async updateUser(u: User) {
      this.db.run(`UPDATE users SET name=?, email=?, passwordHash=?, avatar=?, credits=?, twoFactorEnabled=? WHERE id=?`, [u.name, u.email, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled?1:0, u.id]);
      this.saveToIDB();
  }

  // --- Project / Journal Operations ---
  public async getAllProjects(): Promise<JournalEntry[]> {
    const r = this.db?.exec("SELECT * FROM projects ORDER BY timestamp DESC");
    if (!r?.length) return [];
    return r[0].values.map((v: any[]) => {
        const o = this.mapRow(r[0].columns, v);
        return { 
          ...o, 
          files: JSON.parse(o.files), 
          tags: JSON.parse(o.tags), 
          envVars: o.envVars ? JSON.parse(o.envVars) : {},
          dependencies: o.dependencies ? JSON.parse(o.dependencies) : {}
        };
    });
  }

  public async saveProject(e: JournalEntry) {
      this.db.run(
        `INSERT OR REPLACE INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [e.id, e.prompt, e.timestamp, e.description, JSON.stringify(e.files), JSON.stringify(e.tags), e.mood, e.sentimentScore, e.project, e.contextSource, JSON.stringify(e.envVars), JSON.stringify(e.dependencies || {})]
      );
      this.saveToIDB();
  }

  public async deleteProject(id: string) { this.db.run('DELETE FROM projects WHERE id=?', [id]); this.saveToIDB(); }

  // --- Chat History Operations ---
  public async getRefactorHistory(pid: string): Promise<ChatMessage[]> {
      const r = this.db?.exec("SELECT * FROM refactor_history WHERE project_id = ? ORDER BY timestamp ASC", [pid]);
      if (!r?.length) return [];
      return r[0].values.map((v: any[]) => {
          const o = this.mapRow(r[0].columns, v);
          return { ...o, snapshot: o.snapshot?JSON.parse(o.snapshot):undefined, requiredEnvVars: o.requiredEnvVars?JSON.parse(o.requiredEnvVars):undefined, modifiedFiles: o.modifiedFiles?JSON.parse(o.modifiedFiles):undefined };
      });
  }

  public async saveRefactorMessage(pid: string, m: ChatMessage) {
      this.db.run(`INSERT OR REPLACE INTO refactor_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [m.id, pid, m.role, m.text, m.timestamp, m.snapshot?JSON.stringify(m.snapshot):null, m.reasoning, m.requiredEnvVars?JSON.stringify(m.requiredEnvVars):null, m.modifiedFiles?JSON.stringify(m.modifiedFiles):null]);
      this.saveToIDB();
  }
  
  // --- Misc Helpers ---
  public async getChatHistory(): Promise<ChatMessage[]> {
      const r = this.db?.exec("SELECT * FROM chat_history ORDER BY timestamp ASC");
      if (!r?.length) return [];
      return r[0].values.map((v: any[]) => this.mapRow(r[0].columns, v));
  }
  public async saveChatMessage(m: ChatMessage) { this.db.run("INSERT OR REPLACE INTO chat_history VALUES (?,?,?,?)", [m.id, m.role, m.text, m.timestamp]); this.saveToIDB(); }
  public async setConfig(k: string, v: string) { this.db.run("INSERT OR REPLACE INTO app_config VALUES (?,?)", [k,v]); this.saveToIDB(); }
  public async getConfig(k: string) { const r = this.db?.exec("SELECT value FROM app_config WHERE key=?", [k]); return r?.length ? r[0].values[0][0] : null; }
  public async deleteConfig(k: string) { this.db.run("DELETE FROM app_config WHERE key=?", [k]); this.saveToIDB(); }
  public async getUserTransactions(uid: string): Promise<Transaction[]> { const r = this.db?.exec("SELECT * FROM transactions WHERE userId=?", [uid]); return r?.length ? r[0].values.map((v: any[]) => this.mapRow(r[0].columns, v)) : []; }
  public async addTransaction(t: Transaction) { this.db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?)", [t.id, t.userId, t.amount, t.credits, t.type, t.description, t.timestamp]); this.saveToIDB(); }
  public async exportChatData(pid?: string) { return "[]"; } 
  public async importChatData(j: string, pid?: string) { }
  public async resetDatabase() { indexedDB.deleteDatabase(DB_NAME); window.location.reload(); }

  private mapRow(cols: string[], vals: any[]) { const o: any = {}; cols.forEach((c, i) => o[c] = vals[i]); return o; }
}

export const sqliteService = SqliteService.getInstance();
