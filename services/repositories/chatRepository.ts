
import { ChatMessage, GeneratedFile } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from '../diffService';
import { ProjectRepository } from './projectRepository';

export class ChatRepository extends BaseRepository {

    public async saveChatMessage(m: ChatMessage) {
        // Ensure complex objects are stored properly (Surreal handles JSON automatically)
        await dbCore.query("UPDATE type::thing('chat_history', $id) CONTENT $m", { id: m.id, m });
    }
    
    public async getChatHistory(): Promise<ChatMessage[]> {
        // Select explicit fields to avoid fetching unrelated data if schema expands
        const r = await dbCore.query<ChatMessage>("SELECT id, role, text, timestamp, snapshot, reasoning, plan, modifiedFiles, pendingFile, commands, attachments, requiredEnvVars, envVarsSaved, editorContext, annotations, usage FROM chat_history ORDER BY timestamp ASC");
        return this.mapResults(r);
    }

    public async saveRefactorMessage(pid: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        let snapshotData = m.snapshot;
        
        // Calculate Reverse Diff if we have previous and new state
        if (prevFiles && newFiles) {
            // We store the diff object directly as Surreal handles JSON
            snapshotData = calculateReverseDiff(prevFiles, newFiles) as any;
        }

        const msgToSave = { ...m, snapshot: snapshotData, project_id: pid };
        await dbCore.query("UPDATE type::thing('refactor_history', $id) CONTENT $msg", { id: m.id, msg: msgToSave });
    }

    public async getRefactorHistory(pid: string, projectRepo: ProjectRepository): Promise<ChatMessage[]> {
        const project = await projectRepo.getById(pid);
        if (!project) return [];
        
        let currentFiles = project.files;
        
        // Fetch history with explicit fields
        const r = await dbCore.query<any>("SELECT id, role, text, timestamp, snapshot, project_id, usage, reasoning, plan, modifiedFiles, requiredEnvVars FROM refactor_history WHERE project_id = $pid ORDER BY timestamp DESC", { pid });
        const rows = this.mapResults<any>(r);
        
        const messages: ChatMessage[] = [];
        
        // Reconstruct historical state by applying reverse diffs
        for (const row of rows) {
          const diff = row.snapshot;
          
          const msg: ChatMessage = {
            ...row, 
            snapshot: currentFiles // The snapshot in the message object for UI is the *current* state at that time
          };
          messages.push(msg);
          
          if (diff) {
              // Check if it's a full snapshot (array) or a diff object
              currentFiles = Array.isArray(diff) 
                ? diff 
                : applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
          }
        }
        return messages.reverse();
    }
}
