import { AppError, AppModule, JournalEntry, ChatMessage, User, GeneratedFile, Session, Transaction } from '../types';
import { dbCore } from './db/dbCore';
import { taskService } from './taskService';
import { UserRepository } from './repositories/userRepository';
import { ProjectRepository } from './repositories/projectRepository';
import { SessionRepository } from './repositories/sessionRepository';
import { ChatRepository } from './repositories/chatRepository';

/**
 * SurrealDB Facade.
 * Wraps SurrealDB repositories and provides a clean API for the application.
 * Previously known as sqliteService (renamed to reflect actual DB tech).
 */
class DatabaseFacade {
    private static instance: DatabaseFacade;
    private locks = new Set<string>();
    
    // Repositories
    public users = new UserRepository();
    public projects = new ProjectRepository();
    public sessions = new SessionRepository();
    public chats = new ChatRepository();

    public static getInstance(): DatabaseFacade {
        if (!DatabaseFacade.instance) DatabaseFacade.instance = new DatabaseFacade();
        return DatabaseFacade.instance;
    }

    public async init() { await dbCore.init(); }

    // --- Concurrency / Locking ---
    public async runExclusiveProjectTask<T>(pid: string, desc: string, fn: () => Promise<T>): Promise<T> {
        if (this.locks.has(pid)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        this.locks.add(pid);
        try { return await taskService.addTask(desc, fn); } finally { this.locks.delete(pid); }
    }

    // --- Facade Methods ---
    
    // Users
    public async getUser(email: string) { return this.users.getByEmail(email); }
    public async getUserById(id: string) { return this.users.getById(id); }
    public async createUser(u: User) { return this.users.create(u); }
    public async updateUser(u: User) { return this.users.update(u); }

    // Projects
    public async getAllProjects() { return this.projects.getAll(); }
    public async getProjectById(id: string) { return this.projects.getById(id); }
    
    public async saveProject(e: JournalEntry, force = false) {
        if (this.locks.has(e.id) && !force) throw new AppError("Project is locked.", "LOCKED", AppModule.CORE);
        return this.projects.save(e);
    }
    
    public async deleteProject(id: string) {
        if (this.locks.has(id)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        return this.projects.delete(id);
    }

    // Sessions & Transactions
    public async createSession(s: Session) { return this.sessions.create(s); }
    public async getUserSessions(uid: string) { return this.sessions.getByUser(uid); }
    public async revokeSession(sid: string) { return this.sessions.revoke(sid); }
    public async addTransaction(t: Transaction) { return this.sessions.addTransaction(t); }
    public async getUserTransactions(uid: string) { return this.sessions.getUserTransactions(uid); }

    // Chats
    public async getRefactorHistory(pid: string) { return this.chats.getRefactorHistory(pid, this.projects); }
    public async saveRefactorMessage(pid: string, m: ChatMessage, oldF?: GeneratedFile[], newF?: GeneratedFile[]) {
        return this.chats.saveRefactorMessage(pid, m, oldF, newF);
    }
    public async saveChatMessage(m: ChatMessage) { return this.chats.saveChatMessage(m); }
    public async getChatHistory() { return this.chats.getChatHistory(); }

    // Config (Key-Value in Surreal)
    public async setConfig(k: string, v: string) { 
        // Use UPDATE for upsert behavior
        await dbCore.query("UPDATE type::thing('app_config', $k) CONTENT { value: $v }", { k, v });
    }
    public async getConfig(k: string) { 
        const r: any[] = await dbCore.query("SELECT * FROM type::thing('app_config', $k)", { k });
        return r.length ? r[0].value : null; 
    }
}

export const dbFacade = DatabaseFacade.getInstance();