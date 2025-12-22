
import { JournalEntry } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class ProjectRepository extends BaseRepository {
    
    // Explicitly define all needed fields
    private readonly FIELDS = "meta::id(id) AS uid, prompt, timestamp, description, files, tags, mood, sentimentScore, project, pendingGeneration, contextSource, envVars, dependencies, requiredEnvVars, installCommand, startCommand";

    public async getAll(): Promise<JournalEntry[]> {
        const r = await dbCore.query<JournalEntry>(`SELECT ${this.FIELDS} FROM projects ORDER BY timestamp DESC`);
        return this.mapResults(r, 'uid');
    }

    public async getById(uid: string): Promise<JournalEntry | null> {
        const cleanUid = this.cleanId(uid);
        if (!cleanUid) return null;
        
        const r = await dbCore.query<JournalEntry>(
            `SELECT ${this.FIELDS} FROM projects WHERE id = type::thing('projects', $uid)`, 
            { uid: cleanUid }
        );
        return r.length ? this.mapResult(r[0], 'uid') : null;
    }

    public async create(e: JournalEntry): Promise<void> {
        const op = this.getCreateOperation(e);
        await dbCore.query(op.query, op.params);
    }

    public getCreateOperation(e: JournalEntry) {
        const cleanUid = this.cleanId(e.uid);
        if (!cleanUid) throw new Error("Project UID is missing for creation.");

        // We use type::thing to force the primary key to be our UUID
        const { uid, ...content } = e;
        
        return { 
            query: `CREATE type::thing('projects', $uid) CONTENT $content`, 
            params: { uid: cleanUid, content } 
        };
    }

    public async save(e: JournalEntry): Promise<void> {
        const op = this.getSaveOperation(e);
        await dbCore.query(op.query, op.params);
    }

    public getSaveOperation(e: JournalEntry) {
        const cleanUid = this.cleanId(e.uid);
        if (!cleanUid) throw new Error("Cannot save project without a valid UID.");

        const sql = `
            UPDATE type::thing('projects', $uid) SET
                prompt = $prompt,
                timestamp = <number>$timestamp,
                description = $description,
                files = $files,
                tags = $tags,
                mood = $mood,
                sentimentScore = $sentimentScore,
                project = $project,
                pendingGeneration = $pendingGeneration,
                contextSource = $contextSource,
                envVars = $envVars,
                dependencies = $dependencies,
                requiredEnvVars = $requiredEnvVars,
                installCommand = $installCommand,
                startCommand = $startCommand
        `;
        
        const params = {
            uid: cleanUid,
            prompt: e.prompt || "",
            timestamp: Number(e.timestamp) || Date.now(),
            description: e.description ?? "Initializing...",
            files: e.files ?? [],
            tags: e.tags ?? [],
            mood: e.mood ?? 50,
            sentimentScore: e.sentimentScore ?? 0,
            project: e.project || "Untitled Project",
            pendingGeneration: e.pendingGeneration ?? false,
            contextSource: e.contextSource ?? 'manual',
            envVars: e.envVars ?? {},
            dependencies: e.dependencies ?? {},
            requiredEnvVars: e.requiredEnvVars ?? [],
            installCommand: e.installCommand ?? "",
            startCommand: e.startCommand ?? ""
        };
        return { query: sql, params };
    }

    public async delete(uid: string): Promise<void> {
        const cleanUid = this.cleanId(uid);
        if (!cleanUid) return;
        await dbCore.query("DELETE projects WHERE id = type::thing('projects', $uid)", { uid: cleanUid });
    }
}
