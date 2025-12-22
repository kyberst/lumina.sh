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
    
    public projects = new ProjectRepository();
    public chats = new ChatRepository();

    public static getInstance(): DatabaseFacade {
        if (!DatabaseFacade.instance) DatabaseFacade.instance = new DatabaseFacade();
        return DatabaseFacade.instance;
    }

    public async init() { await dbCore.init(); }

    public async runExclusiveProjectTask<T>(projects_id: string, desc: string, fn: () => Promise<T>): Promise<T> {
        if (this.locks.has(projects_id)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        this.locks.add(projects_id);
        try { return await taskService.addTask(desc, fn); } finally { this.locks.delete(projects_id); }
    }

    public async getAllProjects() { return this.projects.getAll(); }
    public async getProjectById(projects_id: string) { return this.projects.getById(projects_id); }
    
    public async createProject(e: JournalEntry) {
        return this.projects.create(e);
    }
    
    public async saveProject(e: JournalEntry, force = false) {
        if (this.locks.has(e.projects_id) && !force) throw new AppError("Project is locked.", "LOCKED", AppModule.CORE);
        const result = await this.projects.save(e);
        ragService.indexProject(e).catch(err => console.error("RAG Auto-Index Error", err));
        return result;
    }
    
    public async deleteProject(projects_id: string) {
        if (this.locks.has(projects_id)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        return this.projects.delete(projects_id);
    }

    public async atomicCreateProjectWithHistory(entry: JournalEntry, userMessage: ChatMessage) {
        if (this.locks.has(entry.projects_id)) throw new AppError("Project is locked during atomic create.", "LOCKED", AppModule.CORE);

        const ops = [];
        ops.push(this.projects.getCreateOperation(entry));
        
        const userMessageWithSnapshot = { ...userMessage, snapshot: entry.files };
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.projects_id, userMessageWithSnapshot));

        const result = await dbCore.executeTransaction(ops);
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    public async atomicUpdateProjectWithHistory(entry: JournalEntry, modelMessage: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[], userMessage?: ChatMessage) {
        if (this.locks.has(entry.projects_id)) throw new AppError("Project is locked during atomic update.", "LOCKED", AppModule.CORE);

        const ops = [];
        ops.push(this.projects.getSaveOperation(entry));
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.projects_id, modelMessage, prevFiles, newFiles));
        
        if (userMessage) {
            ops.push(this.chats.getSaveRefactorMessageOperation(entry.projects_id, userMessage));
        }

        const result = await dbCore.executeTransaction(ops);
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    public async getRefactorHistory(projects_id: string) { 
        if (!projects_id) return [];
        return this.chats.getRefactorHistory(projects_id, this.projects); 
    }

    public async revertToSnapshot(projects_id: string, snapshot: GeneratedFile[], targetTimestamp: number) {
        const cleanId = this.projects.cleanId(projects_id);
        if (!cleanId) throw new Error("Cannot revert without a valid projects_id");
        
        const projectUpdateOp = {
            query: "UPDATE type::thing('projects', $id) SET files = $files",
            params: { id: cleanId, files: snapshot }
        };
        
        const historyDeleteOp = {
            query: "DELETE refactor_history WHERE project_id = type::thing('projects', $id) AND timestamp > <number>$targetTimestamp",
            params: { id: cleanId, targetTimestamp }
        };
        
        return dbCore.executeTransaction([projectUpdateOp, historyDeleteOp]);
    }

    public async setConfig(k: string, v: string) {
        const query = `UPDATE type::thing('app_config', $k) SET config_val = $v`;
        await dbCore.query(query, { k, v });
    }
    
    public async getConfig(k: string) { 
        const r: any[] = await dbCore.query(
            "SELECT config_val FROM app_config WHERE id = type::thing('app_config', $k)", 
            { k }
        );
        return r.length ? r[0].config_val : null; 
    }

    public async clearProjectsOnly() {
        return dbCore.executeTransaction([
            { query: 'DELETE projects' },
            { query: 'DELETE refactor_history' },
            { query: 'DELETE memories' },
            { query: 'DELETE logs' }
        ]);
    }

    public async clearAllData() {
        return dbCore.executeTransaction([
            { query: 'DELETE projects' },
            { query: 'DELETE refactor_history' },
            { query: 'DELETE chat_history' },
            { query: 'DELETE app_config' },
            { query: 'DELETE memories' },
            { query: 'DELETE logs' }
        ]);
    }
}

export const dbFacade = DatabaseFacade.getInstance();