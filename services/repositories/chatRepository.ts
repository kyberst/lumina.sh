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

    public async getRefactorHistory(projects_id: string, projectRepo: ProjectRepository): Promise<ChatMessage[]> {
        const cleanProjectId = this.cleanId(projects_id);
        if (!cleanProjectId) return [];
        
        const project = await projectRepo.getById(cleanProjectId);
        if (!project) return [];
        
        let currentFiles = project.files || [];
        
        const r = await dbCore.query<any>(
            `SELECT ${this.REFACTOR_FIELDS} FROM refactor_history WHERE project_id = type::thing('projects', $pid) ORDER BY timestamp DESC`, 
            { pid: cleanProjectId }
        );
        
        const rows = this.mapResults<any>(r, 'refactor_history_id');
        const messages: ChatMessage[] = [];
        
        for (const row of rows) {
          const diff = row.snapshot;
          messages.push({ ...row, snapshot: currentFiles });
          if (diff) {
              try {
                  currentFiles = Array.isArray(diff) ? diff : applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
              } catch (err) { console.warn("Snapshot reconstruction error", row.refactor_history_id); }
          }
        }
        return messages.reverse();
    }
}