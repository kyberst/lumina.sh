
import { AppError, AppModule, JournalEntry, ChatMessage, User, Transaction, GeneratedFile } from '../types';
import { logger } from './logger';
import { runMigrations } from './db/migrations';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from './diffService';
import { taskService } from './taskService';

const DB_NAME = 'umbra_dyad.sqlite';

/**
 * SqliteService: Client-side database manager using SQL.js (WASM).
 * 
 * Key Features:
 * 1. Persistence via IndexedDB (loading on init, saving on change).
 * 2. Asynchronous saving using TaskQueue to prevent UI freezing.
 * 3. Smart History: Stores changes as Reverse Diffs to save space.
 * 4. Concurrency Locking: Prevents manual edits during heavy AI tasks.
 */
class SqliteService {
  private db: any = null;
  private static instance: SqliteService;
  private isReady = false;
  
  // Tracks locked project IDs to prevent write conflicts
  private locks = new Set<string>();

  public static getInstance(): SqliteService { 
      if (!SqliteService.instance) SqliteService.instance = new SqliteService(); 
      return SqliteService.instance; 
  }

  /** Initialize WASM DB and load existing data from IndexedDB */
  public async init(): Promise<void> {
    if (this.isReady) return;
    try {
        if (!(window as any).initSqlJs) throw new Error("SQL.js not loaded");
        
        // Load SQL.js WASM
        const SQL = await (window as any).initSqlJs({ 
            locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` 
        });
        
        // Load saved DB file from IndexedDB
        const data = await this.loadFromIDB();
        this.db = data ? new SQL.Database(new Uint8Array(data)) : new SQL.Database();
        
        runMigrations(this.db, !!data);
        this.isReady = true;
        this.saveToIDB(); // Ensure persistence structure
    } catch (e: any) { 
        logger.error(AppModule.CORE, 'Init Failed', e); 
    }
  }

  /** Load binary DB from IndexedDB */
  private loadFromIDB(): Promise<ArrayBuffer | null> {
      return new Promise((res) => {
          const r = indexedDB.open(DB_NAME, 1);
          r.onupgradeneeded = (e: any) => e.target.result.createObjectStore('store');
          r.onsuccess = (e: any) => { 
              const req = e.target.result.transaction('store', 'readonly').objectStore('store').get('db_file'); 
              req.onsuccess = () => res(req.result || null); 
          };
      });
  }

  /** 
   * Save binary DB to IndexedDB using Task Queue.
   * Prevents UI freeze by offloading or queuing the export.
   */
  private saveToIDB() {
      if (!this.db) return;
      
      taskService.addTask("Saving Database...", async () => {
          const d = this.db.export();
          return new Promise((resolve, reject) => {
            const r = indexedDB.open(DB_NAME, 1);
            r.onerror = (e) => reject(e);
            r.onsuccess = (e: any) => { 
                const tx = e.target.result.transaction('store', 'readwrite');
                const req = tx.objectStore('store').put(d, 'db_file');
                req.onsuccess = () => resolve(true);
                req.onerror = (err: any) => reject(err);
            };
          });
      });
  }

  // --- Concurrency / Locking ---

  /**
   * Runs a heavy task exclusively for a project.
   * Blocks any other `saveProject` calls for this ID until the task completes.
   */
  public async runExclusiveProjectTask<T>(projectId: string, description: string, fn: () => Promise<T>): Promise<T> {
      if (this.locks.has(projectId)) {
          throw new AppError("Project is busy with another operation.", "PROJECT_LOCKED", AppModule.CORE);
      }

      this.locks.add(projectId);
      try {
          // Delegate to TaskService for background execution logic
          return await taskService.addTask(description, fn);
      } finally {
          this.locks.delete(projectId);
      }
  }

  public isLocked(projectId: string): boolean {
      return this.locks.has(projectId);
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
      this.db.run(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [u.id, u.email, u.name, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled?1:0, u.createdAt]);
      this.saveToIDB();
  }
  
  public async updateUser(u: User) {
      this.db.run(`UPDATE users SET name=?, email=?, passwordHash=?, avatar=?, credits=?, twoFactorEnabled=? WHERE id=?`, 
        [u.name, u.email, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled?1:0, u.id]);
      this.saveToIDB();
  }

  // --- Project / Journal Operations ---

  public async getAllProjects(): Promise<JournalEntry[]> {
    const r = this.db?.exec("SELECT * FROM projects ORDER BY timestamp DESC");
    if (!r?.length) return [];
    return r[0].values.map((v: any[]) => this.hydrateProject(this.mapRow(r[0].columns, v)));
  }

  public async getProjectById(id: string): Promise<JournalEntry | null> {
      const r = this.db?.exec("SELECT * FROM projects WHERE id = ?", [id]);
      if (!r?.length) return null;
      return this.hydrateProject(this.mapRow(r[0].columns, r[0].values[0]));
  }

  /**
   * Saves the project state.
   * @param force - If true, bypasses the lock check (use only within exclusive tasks)
   */
  public async saveProject(e: JournalEntry, force = false) {
      if (this.locks.has(e.id) && !force) {
          throw new AppError("Project is locked by an AI operation. Please wait.", "PROJECT_LOCKED", AppModule.CORE);
      }

      this.db.run(
        `INSERT OR REPLACE INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [e.id, e.prompt, e.timestamp, e.description, JSON.stringify(e.files), JSON.stringify(e.tags), 
         e.mood, e.sentimentScore, e.project, e.contextSource, JSON.stringify(e.envVars), JSON.stringify(e.dependencies || {})]
      );
      this.saveToIDB();
  }

  public async deleteProject(id: string) { 
      if (this.locks.has(id)) {
          throw new AppError("Cannot delete a locked project.", "PROJECT_LOCKED", AppModule.CORE);
      }
      this.db.run('DELETE FROM projects WHERE id=?', [id]); 
      this.saveToIDB(); 
  }

  // --- History & Snapshots (Reverse Diff Logic) ---

  /**
   * Reconstructs project history by walking backwards from current state (Head).
   * Applies "Reverse Diffs" stored in each message to restore previous states.
   */
  public async getRefactorHistory(pid: string): Promise<ChatMessage[]> {
      const project = await this.getProjectById(pid);
      if (!project) return [];
      
      let currentFiles = project.files;

      // Get history ordered Newest -> Oldest
      const r = this.db?.exec("SELECT * FROM refactor_history WHERE project_id = ? ORDER BY timestamp DESC", [pid]);
      if (!r?.length) return [];
      
      const rows = r[0].values.map((v: any[]) => this.mapRow(r[0].columns, v));
      const messages: ChatMessage[] = [];

      for (const row of rows) {
          // Parse stored diff (Reverse Diff or Legacy Snapshot)
          let diff: any = null;
          try { diff = row.snapshot ? JSON.parse(row.snapshot) : null; } catch(e) {}
          
          // The message "snapshot" property is what the UI sees (The state AFTER this message)
          // Since we are iterating backwards, 'currentFiles' represents the state at this point.
          const msg: ChatMessage = { 
              ...row, 
              snapshot: currentFiles, 
              requiredEnvVars: row.requiredEnvVars ? JSON.parse(row.requiredEnvVars) : undefined, 
              modifiedFiles: row.modifiedFiles ? JSON.parse(row.modifiedFiles) : undefined
          };
          messages.push(msg);

          // Apply Reverse Diff to step back in time for the NEXT iteration
          if (diff) {
              if (Array.isArray(diff)) {
                  // Legacy: Full snapshot found
                  currentFiles = diff as GeneratedFile[];
              } else {
                  // Modern: Apply Reverse Diff (Undo changes)
                  currentFiles = applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
              }
          }
      }

      return messages.reverse(); // Return Oldest -> Newest
  }

  /**
   * Saves a chat message and computes the Reverse Diff.
   * @param previousFiles Files BEFORE the change (Target of Undo)
   * @param newFiles Files AFTER the change (Current State)
   */
  public async saveRefactorMessage(pid: string, m: ChatMessage, previousFiles?: GeneratedFile[], newFiles?: GeneratedFile[], force = false) {
      if (this.locks.has(pid) && !force) {
          throw new AppError("Project is locked.", "PROJECT_LOCKED", AppModule.CORE);
      }

      let snapshotData: string | null = null;
      
      if (previousFiles && newFiles) {
          // Calculate Reverse Diff: Instructions to go from NEW -> OLD
          const reverseDiff = calculateReverseDiff(previousFiles, newFiles);
          snapshotData = JSON.stringify(reverseDiff);
      } else if (m.snapshot && Array.isArray(m.snapshot)) {
          // Fallback: Use explicit legacy snapshot if provided without diff context
          snapshotData = JSON.stringify(m.snapshot);
      }

      this.db.run(`INSERT OR REPLACE INTO refactor_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
          [m.id, pid, m.role, m.text, m.timestamp, snapshotData, m.reasoning, 
           m.requiredEnvVars?JSON.stringify(m.requiredEnvVars):null, m.modifiedFiles?JSON.stringify(m.modifiedFiles):null]
      );
      this.saveToIDB();
  }
  
  // --- Misc Helpers ---

  public async getChatHistory(): Promise<ChatMessage[]> {
      const r = this.db?.exec("SELECT * FROM chat_history ORDER BY timestamp ASC");
      if (!r?.length) return [];
      return r[0].values.map((v: any[]) => this.mapRow(r[0].columns, v));
  }

  public async saveChatMessage(m: ChatMessage) { 
      this.db.run("INSERT OR REPLACE INTO chat_history VALUES (?,?,?,?)", [m.id, m.role, m.text, m.timestamp]); 
      this.saveToIDB(); 
  }

  public async setConfig(k: string, v: string) { 
      this.db.run("INSERT OR REPLACE INTO app_config VALUES (?,?)", [k,v]); 
      this.saveToIDB(); 
  }

  public async getConfig(k: string) { 
      const r = this.db?.exec("SELECT value FROM app_config WHERE key=?", [k]); 
      return r?.length ? r[0].values[0][0] : null; 
  }
  
  private mapRow(cols: string[], vals: any[]) { const o: any = {}; cols.forEach((c, i) => o[c] = vals[i]); return o; }
  private hydrateProject(o: any): JournalEntry {
      return { 
          ...o, files: JSON.parse(o.files), tags: JSON.parse(o.tags), 
          envVars: o.envVars ? JSON.parse(o.envVars) : {}, dependencies: o.dependencies ? JSON.parse(o.dependencies) : {}
      };
  }
}

export const sqliteService = SqliteService.getInstance();
