
import { AppError, AppModule, JournalEntry, ChatMessage, User, GeneratedFile, Session, Transaction } from '../types';
import { dbCore } from './db/dbCore';
import { taskService } from './taskService';
import { UserRepository } from './repositories/userRepository';
import { ProjectRepository } from './repositories/projectRepository';
import { SessionRepository } from './repositories/sessionRepository';
import { ChatRepository } from './repositories/chatRepository';

/**
 * SqliteService Facade.
 * Punto de entrada único para la capa de datos.
 * Delega operaciones a repositorios especializados.
 * Maneja el Lock de Concurrencia global.
 */
class SqliteService {
    private static instance: SqliteService;
    private locks = new Set<string>();
    
    // Repositorios
    public users = new UserRepository();
    public projects = new ProjectRepository();
    public sessions = new SessionRepository();
    public chats = new ChatRepository(); // Definido en su propio archivo (implementación similar)

    public static getInstance(): SqliteService {
        if (!SqliteService.instance) SqliteService.instance = new SqliteService();
        return SqliteService.instance;
    }

    public async init() { await dbCore.init(); }

    // --- Concurrency / Locking ---
    public async runExclusiveProjectTask<T>(pid: string, desc: string, fn: () => Promise<T>): Promise<T> {
        if (this.locks.has(pid)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        this.locks.add(pid);
        try { return await taskService.addTask(desc, fn); } finally { this.locks.delete(pid); }
    }

    // --- Facade Methods (Proxy to Repos for Backward Compatibility) ---
    
    // Users
    public getUser(email: string) { return this.users.getByEmail(email); }
    public getUserById(id: string) { return this.users.getById(id); }
    public createUser(u: User) { return this.users.create(u); }
    public updateUser(u: User) { return this.users.update(u); }

    // Projects (With Lock Check)
    public getAllProjects() { return this.projects.getAll(); }
    public getProjectById(id: string) { return this.projects.getById(id); }
    
    public async saveProject(e: JournalEntry, force = false) {
        if (this.locks.has(e.id) && !force) throw new AppError("Project is locked.", "LOCKED", AppModule.CORE);
        return this.projects.save(e);
    }
    
    public async deleteProject(id: string) {
        if (this.locks.has(id)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        return this.projects.delete(id);
    }

    // Sessions & Transactions
    public createSession(s: Session) { return this.sessions.create(s); }
    public getUserSessions(uid: string) { return this.sessions.getByUser(uid); }
    public revokeSession(sid: string) { return this.sessions.revoke(sid); }
    public addTransaction(t: Transaction) { return this.sessions.addTransaction(t); }
    public getUserTransactions(uid: string) { return this.sessions.getUserTransactions(uid); }

    // Chats & Refactor History (Proxied to ChatRepository)
    public getRefactorHistory(pid: string) { return this.chats.getRefactorHistory(pid, this.projects); }
    public saveRefactorMessage(pid: string, m: ChatMessage, oldF?: GeneratedFile[], newF?: GeneratedFile[]) {
        return this.chats.saveRefactorMessage(pid, m, oldF, newF);
    }
    public saveChatMessage(m: ChatMessage) { return this.chats.saveChatMessage(m); }
    public getChatHistory() { return this.chats.getChatHistory(); }

    // Config
    public async setConfig(k: string, v: string) { dbCore.run("INSERT OR REPLACE INTO app_config VALUES (?,?)", [k, v]); }
    public async getConfig(k: string) { 
        const r = dbCore.exec("SELECT value FROM app_config WHERE key=?", [k]);
        return r.length ? r[0].values[0][0] : null; 
    }
}

export const sqliteService = SqliteService.getInstance();
