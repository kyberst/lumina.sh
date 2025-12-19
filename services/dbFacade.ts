
import { AppError, AppModule, JournalEntry, ChatMessage, GeneratedFile } from '../types';
import { dbCore } from './db/dbCore';
import { taskService } from './taskService';
import { ProjectRepository } from './repositories/projectRepository';
import { ChatRepository } from './repositories/chatRepository';
import { ragService } from './memory/ragService';

/**
 * SurrealDB Facade.
 * Wraps SurrealDB repositories and provides a clean API for the application.
 */
class DatabaseFacade {
    private static instance: DatabaseFacade;
    private locks = new Set<string>();
    
    // Repositories
    public projects = new ProjectRepository();
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
    
    // Projects
    public async getAllProjects() { return this.projects.getAll(); }
    public async getProjectById(id: string) { return this.projects.getById(id); }
    
    public async createProject(e: JournalEntry) {
        return this.projects.create(e);
    }
    
    public async saveProject(e: JournalEntry, force = false) {
        if (this.locks.has(e.id) && !force) throw new AppError("Project is locked.", "LOCKED", AppModule.CORE);
        const result = await this.projects.save(e);
        
        // Trigger background indexing (Fire and forget to not block UI)
        ragService.indexProject(e).catch(err => console.error("RAG Auto-Index Error", err));
        
        return result;
    }
    
    public async deleteProject(id: string) {
        if (this.locks.has(id)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        return this.projects.delete(id);
    }

    public async atomicCreateProjectWithHistory(
        entry: JournalEntry, 
        userMessage: ChatMessage
    ) {
        if (this.locks.has(entry.id)) throw new AppError("Project is locked during atomic create.", "LOCKED", AppModule.CORE);

        const ops = [];
        ops.push(this.projects.getCreateOperation(entry));
        
        const userMessageWithSnapshot = { ...userMessage, snapshot: entry.files };
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.id, userMessageWithSnapshot));

        const result = await dbCore.executeTransaction(ops);
        
        // Trigger background indexing
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    public async atomicUpdateProjectWithHistory(
        entry: JournalEntry, 
        modelMessage: ChatMessage, 
        prevFiles?: GeneratedFile[], 
        newFiles?: GeneratedFile[],
        userMessage?: ChatMessage
    ) {
        if (this.locks.has(entry.id)) throw new AppError("Project is locked during atomic update.", "LOCKED", AppModule.CORE);

        const ops = [];
        
        // 1. Update Project Content
        ops.push(this.projects.getSaveOperation(entry));
        
        // 2. Save Model Message
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.id, modelMessage, prevFiles, newFiles));
        
        // 3. Save User Message
        if (userMessage) {
            ops.push(this.chats.getSaveRefactorMessageOperation(entry.id, userMessage));
        }

        const result = await dbCore.executeTransaction(ops);

        // Trigger background indexing
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    // Chats
    public async getRefactorHistory(pid: string) { return this.chats.getRefactorHistory(pid, this.projects); }
    public async saveRefactorMessage(pid: string, m: ChatMessage, oldF?: GeneratedFile[], newF?: GeneratedFile[]) {
        return this.chats.saveRefactorMessage(pid, m, oldF, newF);
    }
    public async saveChatMessage(m: ChatMessage) { return this.chats.saveChatMessage(m); }
    public async getChatHistory() { return this.chats.getChatHistory(); }

    public async revertToSnapshot(projectId: string, snapshot: GeneratedFile[], targetTimestamp: number) {
        const projectUpdateOp = {
            query: "UPDATE type::thing('projects', $id) SET files = $files",
            params: { id: projectId, files: snapshot }
        };
        
        const historyDeleteOp = {
            query: "DELETE refactor_history WHERE project_id = $projectId AND timestamp > <number>$targetTimestamp",
            params: { projectId, targetTimestamp }
        };
        
        return dbCore.executeTransaction([projectUpdateOp, historyDeleteOp]);
    }

    // Config (Key-Value in Surreal)
    public async setConfig(k: string, v: string) {
        // Fix: Use type::thing for dynamic IDs
        const query = `UPDATE type::thing('app_config', $k) SET value = $v`;
        await dbCore.query(query, { k, v });
    }
    
    public async getConfig(k: string) { 
        // Fix: Explicit field selection 'id, value' to avoid 'SELECT *' and ambiguity with 'SELECT value'
        const r: any[] = await dbCore.query("SELECT id, value FROM type::thing('app_config', $k)", { k });
        return r.length ? r[0].value : null; 
    }

    public async clearAllData() {
        return dbCore.executeTransaction([
            { query: 'DELETE projects' },
            { query: 'DELETE refactor_history' },
            { query: 'DELETE chat_history' },
            { query: 'DELETE app_config' }
        ]);
    }
}

export const dbFacade = DatabaseFacade.getInstance();
