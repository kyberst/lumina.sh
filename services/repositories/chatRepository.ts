
import { ChatMessage, GeneratedFile } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';
import { calculateReverseDiff, applyReverseSnapshotDiff, SnapshotDiff } from '../diffService';
import { ProjectRepository } from './projectRepository';

export class ChatRepository extends BaseRepository {

    private readonly REFACTOR_FIELDS = "meta::id(id) AS mid, role, text, timestamp, snapshot, project_id, usage, reasoning, plan, modifiedFiles, requiredEnvVars";

    public async saveRefactorMessage(puid: string, m: ChatMessage, oldF?: GeneratedFile[], newF?: GeneratedFile[]) {
        const op = this.getSaveRefactorMessageOperation(puid, m, oldF, newF);
        await dbCore.query(op.query, op.params);
    }

    public getSaveRefactorMessageOperation(puid: string, m: ChatMessage, prevFiles?: GeneratedFile[], newFiles?: GeneratedFile[]) {
        const snapshotData = (prevFiles && newFiles) 
            ? calculateReverseDiff(prevFiles, newFiles) 
            : m.snapshot;

        const cleanPuid = this.cleanId(puid);
        const cleanMid = this.cleanId(m.mid);

        if (!cleanPuid || !cleanMid) {
            throw new Error(`Invalid IDs for refactor message: project=${cleanPuid}, message=${cleanMid}`);
        }

        const { mid, project_uid, ...rest } = m;

        return {
            query: `UPDATE type::thing('refactor_history', $mid) SET 
                project_id = type::thing('projects', $puid), 
                role = $msg.role, 
                text = $msg.text, 
                timestamp = $msg.timestamp, 
                snapshot = $snapshot, 
                reasoning = $msg.reasoning, 
                plan = $msg.plan, 
                modifiedFiles = $msg.modifiedFiles, 
                usage = $msg.usage, 
                requiredEnvVars = $msg.requiredEnvVars`,
            params: { mid: cleanMid, puid: cleanPuid, msg: rest, snapshot: snapshotData }
        };
    }

    public async getRefactorHistory(puid: string, projectRepo: ProjectRepository): Promise<ChatMessage[]> {
        const cleanPuid = this.cleanId(puid);
        if (!cleanPuid) return [];
        
        const project = await projectRepo.getById(cleanPuid);
        if (!project) return [];
        
        let currentFiles = project.files || [];
        
        const r = await dbCore.query<any>(
            `SELECT ${this.REFACTOR_FIELDS} FROM refactor_history WHERE project_id = type::thing('projects', $puid) ORDER BY timestamp DESC`, 
            { puid: cleanPuid }
        );
        
        const rows = this.mapResults<any>(r, 'mid');
        const messages: ChatMessage[] = [];
        
        for (const row of rows) {
          const diff = row.snapshot;
          messages.push({ ...row, snapshot: currentFiles });
          if (diff) {
              try {
                  currentFiles = Array.isArray(diff) ? diff : applyReverseSnapshotDiff(currentFiles, diff as SnapshotDiff);
              } catch (err) { console.warn("Snapshot reconstruction error", row.mid); }
          }
        }
        return messages.reverse();
    }
}
