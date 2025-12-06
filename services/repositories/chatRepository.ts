
import { ChatMessage, GeneratedFile, JournalEntry } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from '../diffService';
import { ProjectRepository } from './projectRepository';

/**
 * Chat Repository.
 * Maneja el historial de chat y la lógica compleja de reconstrucción de Diffs.
 */
export class ChatRepository extends BaseRepository {

    public async saveChatMessage(m: ChatMessage) {
        dbCore.run("INSERT OR REPLACE INTO chat_history VALUES (?,?,?,?)", [m.id, m.role, m.text, m.timestamp]);
    }
    
    public async getChatHistory(): Promise<ChatMessage[]> {
        const r = dbCore.exec("SELECT * FROM chat_history ORDER BY timestamp ASC");
        if(!r.length) return [];
        return this.mapRows(r[0]);
    }

    public async saveRefactorMessage(pid: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        let snapshotData: string | null = null;
        // Calcular Reverse Diff si tenemos estado previo y nuevo
        if (prevFiles && newFiles) {
            snapshotData = JSON.stringify(calculateReverseDiff(prevFiles, newFiles));
        } else if (m.snapshot && Array.isArray(m.snapshot)) {
            snapshotData = JSON.stringify(m.snapshot);
        }

        dbCore.run(`INSERT OR REPLACE INTO refactor_history VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.id, pid, m.role, m.text, m.timestamp, snapshotData, m.reasoning,
            m.requiredEnvVars ? JSON.stringify(m.requiredEnvVars) : null, 
            m.modifiedFiles ? JSON.stringify(m.modifiedFiles) : null
          ]
        );
    }

    public async getRefactorHistory(pid: string, projectRepo: ProjectRepository): Promise<ChatMessage[]> {
        const project = await projectRepo.getById(pid);
        if (!project) return [];
        
        let currentFiles = project.files;
        const r = dbCore.exec("SELECT * FROM refactor_history WHERE project_id = ? ORDER BY timestamp DESC", [pid]);
        if (!r.length) return [];
        
        const rows = this.mapRows(r[0]);
        const messages: ChatMessage[] = [];
        
        // Reconstrucción de estado histórico aplicando diffs inversos
        for (const row of rows) {
          let diff: any = null;
          try { diff = row.snapshot ? JSON.parse(row.snapshot) : null; } catch (e) {}
          
          const msg: ChatMessage = {
            ...row, 
            snapshot: currentFiles, 
            requiredEnvVars: row.requiredEnvVars ? JSON.parse(row.requiredEnvVars) : undefined,
            modifiedFiles: row.modifiedFiles ? JSON.parse(row.modifiedFiles) : undefined
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
