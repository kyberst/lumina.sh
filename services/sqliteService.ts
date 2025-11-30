
import { AppError, AppModule, JournalEntry, ChatMessage, GeneratedFile, User, Transaction } from '../types';
import { logger } from './logger';

const DB_NAME = 'umbra_dyad.sqlite';
const STORE_NAME = 'db_store';
const KEY_NAME = 'db_file';

class SqliteService {
  private db: any = null;
  private static instance: SqliteService;
  private isReady: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): SqliteService {
    if (!SqliteService.instance) {
      SqliteService.instance = new SqliteService();
    }
    return SqliteService.instance;
  }

  // Initialize DB: Load WASM -> Load Binary from IndexedDB -> Mount to SQL.js
  public async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
        try {
            logger.info(AppModule.CORE, 'Initializing SQLite...');

            // Wait for script to load
            let attempts = 0;
            while (!(window as any).initSqlJs && attempts < 50) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            if (!(window as any).initSqlJs) {
                throw new Error("SQL.js script not loaded");
            }

            // 1. Load SQL.js WASM
            const sqlPromise = (window as any).initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });

            // 2. Load Data from IndexedDB
            const dataPromise = this.loadFromIndexedDB();

            const [SQL, data] = await Promise.all([sqlPromise, dataPromise]);

            if (data) {
                this.db = new SQL.Database(new Uint8Array(data));
                logger.info(AppModule.CORE, 'Loaded existing database from disk');
                this.runMigrations(true); 
            } else {
                this.db = new SQL.Database();
                this.runMigrations(false);
                logger.info(AppModule.CORE, 'Created new empty database');
            }

            this.isReady = true;
            this.saveToIndexedDB(); // Ensure structure is saved

        } catch (error: any) {
            logger.error(AppModule.CORE, 'SQLite Init Failed', error);
            this.initPromise = null; // Allow retry
            throw new AppError('Database initialization failed: ' + error.message, 'DB_INIT_ERR', AppModule.CORE);
        }
    })();

    return this.initPromise;
  }

  private runMigrations(isUpdate: boolean) {
    if (!this.db) return;
    
    // User Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        passwordHash TEXT,
        avatar TEXT,
        credits INTEGER,
        twoFactorEnabled INTEGER,
        createdAt INTEGER
      );
    `);

    // Transactions Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amount REAL,
        credits INTEGER,
        type TEXT,
        description TEXT,
        timestamp INTEGER
      );
    `);

    // Projects Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        prompt TEXT,
        timestamp INTEGER,
        description TEXT,
        files TEXT, 
        tags TEXT,
        mood INTEGER,
        sentimentScore REAL,
        project TEXT,
        contextSource TEXT,
        envVars TEXT
      );
    `);

    // Global Chat History Table (Assistant)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        role TEXT,
        text TEXT,
        timestamp INTEGER
      );
    `);

    // Refactor History Table (Project Specific with Snapshots)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS refactor_history (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        role TEXT,
        text TEXT,
        timestamp INTEGER,
        snapshot TEXT,
        reasoning TEXT,
        requiredEnvVars TEXT,
        modifiedFiles TEXT
      );
    `);

    // App Configuration Table (Secure Storage)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Migrations for existing DBs
    if (isUpdate) {
      try { this.db.run("ALTER TABLE refactor_history ADD COLUMN reasoning TEXT"); } catch (e) { }
      try { this.db.run("ALTER TABLE projects ADD COLUMN envVars TEXT"); } catch (e) { }
      try { this.db.run("ALTER TABLE refactor_history ADD COLUMN requiredEnvVars TEXT"); } catch (e) { }
      try { this.db.run("ALTER TABLE refactor_history ADD COLUMN modifiedFiles TEXT"); } catch (e) { }
    }
  }

  // --- PERSISTENCE (IndexedDB) ---

  private async loadFromIndexedDB(): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(KEY_NAME);
        
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToIndexedDB(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const putReq = store.put(data, KEY_NAME);
        
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- USER OPERATIONS ---

  public async createUser(user: User): Promise<void> {
      this.ensureReady();
      const stmt = this.db.prepare(`
        INSERT INTO users (id, email, name, passwordHash, avatar, credits, twoFactorEnabled, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      try {
          stmt.run([user.id, user.email, user.name, user.passwordHash, user.avatar || '', user.credits, user.twoFactorEnabled ? 1 : 0, user.createdAt]);
          stmt.free();
          await this.saveToIndexedDB();
      } catch(e: any) {
          throw new AppError("Email already exists", "USER_EXISTS", AppModule.AUTH);
      }
  }

  public async getUser(email: string): Promise<User | null> {
      this.ensureReady();
      const result = this.db.exec("SELECT * FROM users WHERE email = ?", [email]);
      if (!result.length) return null;
      const row = result[0].values[0];
      const cols = result[0].columns;
      const user: any = {};
      cols.forEach((c: string, i: number) => user[c] = row[i]);
      return { ...user, twoFactorEnabled: !!user.twoFactorEnabled } as User;
  }
  
  public async getUserById(id: string): Promise<User | null> {
      this.ensureReady();
      const result = this.db.exec("SELECT * FROM users WHERE id = ?", [id]);
      if (!result.length) return null;
      const row = result[0].values[0];
      const cols = result[0].columns;
      const user: any = {};
      cols.forEach((c: string, i: number) => user[c] = row[i]);
      return { ...user, twoFactorEnabled: !!user.twoFactorEnabled } as User;
  }

  public async updateUser(user: User): Promise<void> {
      this.ensureReady();
      const stmt = this.db.prepare(`
        UPDATE users SET name = ?, email = ?, passwordHash = ?, avatar = ?, credits = ?, twoFactorEnabled = ? WHERE id = ?
      `);
      stmt.run([user.name, user.email, user.passwordHash, user.avatar, user.credits, user.twoFactorEnabled ? 1 : 0, user.id]);
      stmt.free();
      await this.saveToIndexedDB();
  }

  public async addTransaction(tx: Transaction): Promise<void> {
      this.ensureReady();
      this.db.run(`INSERT INTO transactions (id, userId, amount, credits, type, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.userId, tx.amount, tx.credits, tx.type, tx.description, tx.timestamp]
      );
      await this.saveToIndexedDB();
  }

  public async getUserTransactions(userId: string): Promise<Transaction[]> {
      this.ensureReady();
      const result = this.db.exec("SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC", [userId]);
      if (!result.length) return [];
      const cols = result[0].columns;
      return result[0].values.map((row: any[]) => {
          const obj: any = {};
          cols.forEach((c: string, i: number) => obj[c] = row[i]);
          return obj as Transaction;
      });
  }

  // --- CONFIG OPERATIONS ---

  public async setConfig(key: string, value: string): Promise<void> {
    this.ensureReady();
    this.db.run(`INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)`, [key, value]);
    await this.saveToIndexedDB();
  }

  public async getConfig(key: string): Promise<string | null> {
    this.ensureReady();
    const result = this.db.exec(`SELECT value FROM app_config WHERE key = ?`, [key]);
    if (!result.length || !result[0].values.length) return null;
    return result[0].values[0][0] as string;
  }

  public async deleteConfig(key: string): Promise<void> {
    this.ensureReady();
    this.db.run(`DELETE FROM app_config WHERE key = ?`, [key]);
    await this.saveToIndexedDB();
  }

  // --- PROJECTS ---

  public async saveProject(entry: JournalEntry): Promise<void> {
    this.ensureReady();
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO projects (id, prompt, timestamp, description, files, tags, mood, sentimentScore, project, contextSource, envVars)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run([
        entry.id,
        entry.prompt,
        entry.timestamp,
        entry.description || '',
        JSON.stringify(entry.files),
        JSON.stringify(entry.tags),
        entry.mood,
        entry.sentimentScore || 0,
        entry.project || 'Untitled',
        entry.contextSource || 'manual',
        JSON.stringify(entry.envVars || {})
      ]);
      stmt.free();
      await this.saveToIndexedDB();
    } catch (e: any) {
      throw new AppError(e.message, 'DB_WRITE_ERR', AppModule.CORE);
    }
  }

  public async deleteProject(id: string): Promise<void> {
    this.ensureReady();
    this.db.run('DELETE FROM projects WHERE id = ?', [id]);
    this.db.run('DELETE FROM refactor_history WHERE project_id = ?', [id]);
    await this.saveToIndexedDB();
  }

  public async getAllProjects(): Promise<JournalEntry[]> {
    this.ensureReady();
    const result = this.db.exec("SELECT * FROM projects ORDER BY timestamp DESC");
    if (!result.length) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return {
        ...obj,
        files: JSON.parse(obj.files),
        tags: JSON.parse(obj.tags),
        mood: Number(obj.mood),
        timestamp: Number(obj.timestamp),
        envVars: obj.envVars ? JSON.parse(obj.envVars) : {}
      } as JournalEntry;
    });
  }

  // --- CHAT OPERATIONS ---

  public async saveChatMessage(msg: ChatMessage): Promise<void> {
    this.ensureReady();
    this.db.run(`INSERT OR REPLACE INTO chat_history (id, role, text, timestamp) VALUES (?, ?, ?, ?)`, 
      [msg.id, msg.role, msg.text, msg.timestamp]
    );
    await this.saveToIndexedDB();
  }

  public async getChatHistory(): Promise<ChatMessage[]> {
    this.ensureReady();
    const result = this.db.exec("SELECT * FROM chat_history ORDER BY timestamp ASC");
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      return obj as ChatMessage;
    });
  }

  public async saveRefactorMessage(projectId: string, msg: ChatMessage): Promise<void> {
    this.ensureReady();
    const snapshotStr = msg.snapshot ? JSON.stringify(msg.snapshot) : null;
    const reqEnv = msg.requiredEnvVars ? JSON.stringify(msg.requiredEnvVars) : null;
    const modFiles = msg.modifiedFiles ? JSON.stringify(msg.modifiedFiles) : null;

    try { this.db.run("ALTER TABLE refactor_history ADD COLUMN requiredEnvVars TEXT"); } catch(e){}
    try { this.db.run("ALTER TABLE refactor_history ADD COLUMN modifiedFiles TEXT"); } catch(e){}

    this.db.run(
      `INSERT OR REPLACE INTO refactor_history (id, project_id, role, text, timestamp, snapshot, reasoning, requiredEnvVars, modifiedFiles) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [msg.id, projectId, msg.role, msg.text, msg.timestamp, snapshotStr, msg.reasoning || null, reqEnv, modFiles]
    );
    await this.saveToIndexedDB();
  }

  public async getRefactorHistory(projectId: string): Promise<ChatMessage[]> {
    this.ensureReady();
    const result = this.db.exec("SELECT * FROM refactor_history WHERE project_id = ? ORDER BY timestamp ASC", [projectId]);
    if (!result.length) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      return {
        id: obj.id,
        role: obj.role,
        text: obj.text,
        timestamp: obj.timestamp,
        snapshot: obj.snapshot ? JSON.parse(obj.snapshot) : undefined,
        reasoning: obj.reasoning || undefined,
        requiredEnvVars: obj.requiredEnvVars ? JSON.parse(obj.requiredEnvVars) : undefined,
        modifiedFiles: obj.modifiedFiles ? JSON.parse(obj.modifiedFiles) : undefined
      } as ChatMessage;
    });
  }

  // --- EXPORT/IMPORT UTILS ---
  
  public async exportChatData(projectId?: string): Promise<string> {
    this.ensureReady();
    let query = "SELECT * FROM chat_history ORDER BY timestamp ASC";
    let params: any[] = [];
    
    if (projectId) {
      query = "SELECT * FROM refactor_history WHERE project_id = ? ORDER BY timestamp ASC";
      params = [projectId];
    }
    
    const result = this.db.exec(query, params);
    if (!result.length) return "[]";
    
    const columns = result[0].columns;
    const rows = result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      if(obj.snapshot) obj.snapshot = JSON.parse(obj.snapshot);
      if(obj.requiredEnvVars) obj.requiredEnvVars = JSON.parse(obj.requiredEnvVars);
      if(obj.modifiedFiles) obj.modifiedFiles = JSON.parse(obj.modifiedFiles);
      return obj;
    });
    
    return JSON.stringify(rows, null, 2);
  }

  public async importChatData(json: string, projectId?: string): Promise<void> {
    this.ensureReady();
    const messages = JSON.parse(json);
    if (!Array.isArray(messages)) throw new Error("Invalid format");

    this.db.run("BEGIN TRANSACTION");
    try {
      if (projectId) {
        try { this.db.run("ALTER TABLE refactor_history ADD COLUMN requiredEnvVars TEXT"); } catch(e){}
        try { this.db.run("ALTER TABLE refactor_history ADD COLUMN modifiedFiles TEXT"); } catch(e){}

        const stmt = this.db.prepare(
          `INSERT OR REPLACE INTO refactor_history (id, project_id, role, text, timestamp, snapshot, reasoning, requiredEnvVars, modifiedFiles) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const msg of messages) {
          const snap = msg.snapshot ? JSON.stringify(msg.snapshot) : null;
          const reqEnv = msg.requiredEnvVars ? JSON.stringify(msg.requiredEnvVars) : null;
          const modFiles = msg.modifiedFiles ? JSON.stringify(msg.modifiedFiles) : null;
          stmt.run([msg.id || crypto.randomUUID(), projectId, msg.role, msg.text, msg.timestamp, snap, msg.reasoning, reqEnv, modFiles]);
        }
        stmt.free();
      } else {
         const stmt = this.db.prepare(
          `INSERT OR REPLACE INTO chat_history (id, role, text, timestamp) VALUES (?, ?, ?, ?)`
        );
        for (const msg of messages) {
          stmt.run([msg.id || crypto.randomUUID(), msg.role, msg.text, msg.timestamp]);
        }
        stmt.free();
      }
      this.db.run("COMMIT");
      await this.saveToIndexedDB();
    } catch (e) {
      this.db.run("ROLLBACK");
      throw e;
    }
  }

  // --- DANGER ZONE ---
  public async resetDatabase(): Promise<void> {
    if (!this.db) return;
    this.db.close();
    this.db = null;
    this.isReady = false;

    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => {
             SqliteService.instance = new SqliteService();
             resolve();
             window.location.reload(); 
        };
        req.onerror = () => reject(req.error);
    });
  }

  private ensureReady() {
    if (!this.isReady) throw new AppError('Database not initialized', 'DB_NOT_READY', AppModule.CORE);
  }
}

export const sqliteService = SqliteService.getInstance();
