import { ChatMessage, GeneratedFile } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from '../diffService';
import { ProjectRepository } from './projectRepository';

export class ChatRepository extends BaseRepository {

    // Explicit fields for chat history to avoid SELECT *
    private readonly CHAT_FIELDS = "id, role, text, timestamp, snapshot, reasoning, plan, modifiedFiles, pendingFile, commands, attachments, requiredEnvVars, envVarsSaved, editorContext, annotations, usage";
    
    // Explicit fields for refactor history
    private readonly REFACTOR_FIELDS = "id, role, text, timestamp, snapshot, project_id, usage, reasoning, plan, modifiedFiles, requiredEnvVars";

    public async saveChatMessage(m: ChatMessage) {
        // Fix: Use type::thing
        await dbCore.query("UPDATE type::thing('chat_history', $id) CONTENT $m", { id: m.id, m });
    }

    public getSaveChatMessageOperation(m: ChatMessage) {
        return {
            query: "UPDATE type::thing('chat_history', $id) CONTENT $m",
            params: { id: m.id, m }
        };
    }
    
    public async getChatHistory(): Promise<ChatMessage[]> {
        // Fix: Explicit fields
        const r = await dbCore.query<ChatMessage>(`SELECT ${this.CHAT_FIELDS} FROM chat_history ORDER BY timestamp ASC`);
        return this.mapResults(r);
    }

    public async saveRefactorMessage(pid: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        const op = this.getSaveRefactorMessageOperation(pid, m, prevFiles, newFiles);
        await dbCore.query(op.query, op.params);
    }

    public getSaveRefactorMessageOperation(pid: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        let snapshotData;
        
        if (prevFiles && newFiles) {
            snapshotData = calculateReverseDiff(prevFiles, newFiles) as any;
        } else {
            snapshotData = m.snapshot;
        }

        const msgToSave = { ...m, snapshot: snapshotData, project_id: pid };
        // Fix: Use type::thing
        return {
            query: "UPDATE type::thing('refactor_history', $id) CONTENT $msg",
            params: { id: m.id, msg: msgToSave }
        };
    }

    public async getRefactorHistory(pid: string, projectRepo: ProjectRepository): Promise<ChatMessage[]> {
        const project = await projectRepo.getById(pid);
        if (!project) return [];
        
        let currentFiles = project.files;
        
        // Fix: Explicit fields
        const r = await dbCore.query<any>(`SELECT ${this.REFACTOR_FIELDS} FROM refactor_history WHERE project_id = $pid ORDER BY timestamp DESC`, { pid });
        const rows = this.mapResults<any>(r);
        
        const messages: ChatMessage[] = [];
        
        for (const row of rows) {
          const diff = row.snapshot;
          
          const msg: ChatMessage = {
            ...row, 
            snapshot: currentFiles 
          };
          messages.push(msg);
          
          if (diff) {
              currentFiles = Array.isArray(diff) 
                ? diff 
                : applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
          }
        }
        return messages.reverse();
    }
}