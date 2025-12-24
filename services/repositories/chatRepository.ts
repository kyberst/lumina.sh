
import { ChatMessage, GeneratedFile } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from '../diffService';
import { ProjectRepository } from './projectRepository';

export class ChatRepository extends BaseRepository {

    private readonly REFACTOR_FIELDS = "meta::id(id) AS refactor_history_id, role, text, timestamp, snapshot, project_id AS projects_id, usage, reasoning, plan, modifiedFiles, requiredEnvVars";

    public async saveRefactorMessage(projects_id: string, m: ChatMessage, oldF?: GeneratedFile[], newF?: GeneratedFile[]) {
        const op = this.getSaveRefactorMessageOperation(projects_id, m, oldF, newF);
        await dbCore.query(op.query, op.params);
    }

    /**
     * Generates an UPDATE operation for a chat message.
     * UPDATE in SurrealDB creates the record if the ID is specified and doesn't exist.
     */
    public getSaveRefactorMessageOperation(projects_id: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        const snapshotData = (prevFiles && newFiles) 
            ? calculateReverseDiff(prevFiles, newFiles) 
            : m.snapshot;

        const cleanProjectId = this.cleanId(projects_id);
        const cleanMsgId = this.cleanId(m.refactor_history_id);

        if (!cleanProjectId || !cleanMsgId) {
            throw new Error(`Invalid IDs for refactor message: project=${cleanProjectId}, message=${cleanMsgId}`);
        }

        const { refactor_history_id, projects_id: _, ...rest } = m;

        return {
            query: `UPDATE type::thing('refactor_history', $mid) SET 
                project_id = type::thing('projects', $pid), 
                role = $msg.role, 
                text = $msg.text, 
                timestamp = $msg.timestamp, 
                snapshot = $snapshot, 
                reasoning = $msg.reasoning, 
                plan = $msg.plan, 
                modifiedFiles = $msg.modifiedFiles, 
                usage = $msg.usage, 
                requiredEnvVars = $msg.requiredEnvVars`,
            params: { mid: cleanMsgId, pid: cleanProjectId, msg: rest, snapshot: snapshotData }
        };
    }

    /**
     * Reconstituye el historial con Snapshots Atómicos.
     * Camina hacia atrás desde el estado HEAD actual aplicando diffs inversos.
     */
    public async getRefactorHistory(projects_id: string, projectRepo: ProjectRepository, limit: number = 30): Promise<ChatMessage[]> {
        const cleanProjectId = this.cleanId(projects_id);
        if (!cleanProjectId) return [];
        
        const project = await projectRepo.getById(cleanProjectId);
        if (!project) return [];
        
        // El estado actual (HEAD) es nuestro punto de partida para caminar hacia atrás
        let currentFiles = (project.files || []).map(f => ({...f}));
        
        const r = await dbCore.query<any>(
            `SELECT ${this.REFACTOR_FIELDS} FROM refactor_history 
             WHERE project_id = type::thing('projects', $pid) 
             ORDER BY timestamp DESC 
             LIMIT $limit`, 
            { pid: cleanProjectId, limit }
        );
        
        const rows = this.mapResults<any>(r, 'refactor_history_id');
        const messages: ChatMessage[] = [];
        
        for (const row of rows) {
          // El snapshot guardado en este punto representa el estado DESPUÉS de aplicar el mensaje.
          messages.push({ ...row, snapshot: currentFiles.map(f => ({...f})) });
          
          // Ahora aplicamos el diff inverso (Undo) para saber cómo eran los archivos ANTES de este mensaje
          const diff = row.snapshot;
          if (diff) {
              try {
                  if (Array.isArray(diff)) {
                      // Es un snapshot completo (fallback o mensaje inicial)
                      currentFiles = diff; 
                  } else {
                      // Es un SnapshotDiff (instrucciones de revertir)
                      currentFiles = applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
                  }
              } catch (err) { 
                  console.warn(`[Reconstitution] Error in msg ${row.refactor_history_id}:`, err); 
              }
          }
        }
        
        // Retornamos en orden cronológico (más antiguo primero)
        return messages.reverse();
    }
}
