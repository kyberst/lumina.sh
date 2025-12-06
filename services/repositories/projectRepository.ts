
import { JournalEntry, AppError, AppModule } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

/**
 * Project Repository.
 * Maneja el almacenamiento y recuperación de JournalEntries.
 */
export class ProjectRepository extends BaseRepository {
    
    public async getAll(): Promise<JournalEntry[]> {
        const r = dbCore.exec("SELECT * FROM projects ORDER BY timestamp DESC");
        if (!r.length) return [];
        return this.mapRows(r[0]).map(this.hydrate);
    }

    public async getById(id: string): Promise<JournalEntry | null> {
        const r = dbCore.exec("SELECT * FROM projects WHERE id = ?", [id]);
        return r.length ? this.hydrate(this.mapRow(r[0])) : null;
    }

    public async save(e: JournalEntry): Promise<void> {
        dbCore.run(
            `INSERT OR REPLACE INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                e.id, e.prompt, e.timestamp, e.description, 
                JSON.stringify(e.files), JSON.stringify(e.tags),
                e.mood, e.sentimentScore, e.project, e.contextSource, 
                JSON.stringify(e.envVars), JSON.stringify(e.dependencies)
            ]
        );
    }

    public async delete(id: string): Promise<void> {
        dbCore.run('DELETE FROM projects WHERE id=?', [id]);
    }

    // Hidratación de objetos JSON almacenados como string
    private hydrate(o: any): JournalEntry {
        return {
            ...o,
            files: JSON.parse(o.files),
            tags: JSON.parse(o.tags),
            envVars: o.envVars ? JSON.parse(o.envVars) : {},
            dependencies: o.dependencies ? JSON.parse(o.dependencies) : {}
        };
    }
}
