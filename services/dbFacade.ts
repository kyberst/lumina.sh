
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

    public async runExclusiveProjectTask<T>(puid: string, desc: string, fn: () => Promise<T>): Promise<T> {
        if (this.locks.has(puid)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        this.locks.add(puid);
        try { return await taskService.addTask(desc, fn); } finally { this.locks.delete(puid); }
    }

    public async getAllProjects() { return this.projects.getAll(); }
    public async getProjectById(uid: string) { return this.projects.getById(uid); }
    
    public async createProject(e: JournalEntry) {
        return this.projects.create(e);
    }
    
    public async saveProject(e: JournalEntry, force = false) {
        if (this.locks.has(e.uid) && !force) throw new AppError("Project is locked.", "LOCKED", AppModule.CORE);
        const result = await this.projects.save(e);
        ragService.indexProject(e).catch(err => console.error("RAG Auto-Index Error", err));
        return result;
    }
    
    public async deleteProject(uid: string) {
        if (this.locks.has(uid)) throw new AppError("Project Locked", "LOCKED", AppModule.CORE);
        return this.projects.delete(uid);
    }

    public async atomicCreateProjectWithHistory(entry: JournalEntry, userMessage: ChatMessage) {
        if (this.locks.has(entry.uid)) throw new AppError("Project is locked during atomic create.", "LOCKED", AppModule.CORE);

        const ops = [];
        ops.push(this.projects.getCreateOperation(entry));
        
        const userMessageWithSnapshot = { ...userMessage, snapshot: entry.files };
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.uid, userMessageWithSnapshot));

        const result = await dbCore.executeTransaction(ops);
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    public async atomicUpdateProjectWithHistory(entry: JournalEntry, modelMessage: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[], userMessage?: ChatMessage) {
        if (this.locks.has(entry.uid)) throw new AppError("Project is locked during atomic update.", "LOCKED", AppModule.CORE);

        const ops = [];
        ops.push(this.projects.getSaveOperation(entry));
        ops.push(this.chats.getSaveRefactorMessageOperation(entry.uid, modelMessage, prevFiles, newFiles));
        
        if (userMessage) {
            ops.push(this.chats.getSaveRefactorMessageOperation(entry.uid, userMessage));
        }

        const result = await dbCore.executeTransaction(ops);
        ragService.indexProject(entry).catch(err => console.error("RAG Auto-Index Error", err));

        return result;
    }

    public async getRefactorHistory(puid: string) { 
        if (!puid) return [];
        return this.chats.getRefactorHistory(puid, this.projects); 
    }

    public async revertToSnapshot(projectUid: string, snapshot: GeneratedFile[], targetTimestamp: number) {
        const cleanUid = this.projects.cleanId(projectUid);
        if (!cleanUid) throw new Error("Cannot revert without a valid project UID");
        
        const projectUpdateOp = {
            query: "UPDATE type::thing('projects', $uid) SET files = $files",
            params: { uid: cleanUid, files: snapshot }
        };
        
        const historyDeleteOp = {
            query: "DELETE refactor_history WHERE project_id = type::thing('projects', $uid) AND timestamp > <number>$targetTimestamp",
            params: { uid: cleanUid, targetTimestamp }
        };
        
        return dbCore.executeTransaction([projectUpdateOp, historyDeleteOp]);
    }

    public async setConfig(k: string, v: string) {
        // Use non-reserved field 'config_val'
        const query = `UPDATE type::thing('app_config', $k) SET config_val = $v`;
        await dbCore.query(query, { k, v });
    }
    
    public async getConfig(k: string) { 
        // Use explicit field and avoid functions in FROM clause to prevent parse errors
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
