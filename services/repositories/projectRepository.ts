
import { JournalEntry } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class ProjectRepository extends BaseRepository {
    
    public async getAll(): Promise<JournalEntry[]> {
        const r = await dbCore.query<JournalEntry>("SELECT id, prompt, timestamp, description, files, tags, mood, sentimentScore, project, pendingGeneration, contextSource, envVars, dependencies, requiredEnvVars, installCommand, startCommand FROM projects ORDER BY timestamp DESC");
        return this.mapResults(r);
    }

    public async getById(id: string): Promise<JournalEntry | null> {
        const r = await dbCore.query<JournalEntry>("SELECT id, prompt, timestamp, description, files, tags, mood, sentimentScore, project, pendingGeneration, contextSource, envVars, dependencies, requiredEnvVars, installCommand, startCommand FROM projects WHERE id = <string>$id", { id });
        return r.length ? this.mapResult(r[0]) : null;
    }

    public async save(e: JournalEntry): Promise<void> {
        // Upsert logic
        await dbCore.query("UPDATE type::thing('projects', $id) CONTENT $e", { id: e.id, e });
    }

    /**
     * Returns the operation object for a save action, to be used in transactions.
     */
    public getSaveOperation(e: JournalEntry) {
        return {
            query: "UPDATE type::thing('projects', $id) CONTENT $e",
            params: { id: e.id, e }
        };
    }

    public async delete(id: string): Promise<void> {
        await dbCore.query("DELETE type::thing('projects', $id)", { id });
    }
}
