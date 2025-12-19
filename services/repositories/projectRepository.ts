import { JournalEntry } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class ProjectRepository extends BaseRepository {
    
    private readonly FIELDS = "id, prompt, timestamp, description, files, tags, mood, sentimentScore, project, pendingGeneration, contextSource, envVars, dependencies, requiredEnvVars, installCommand, startCommand";

    public async getAll(): Promise<JournalEntry[]> {
        // No SELECT *
        const r = await dbCore.query<JournalEntry>(`SELECT ${this.FIELDS} FROM projects ORDER BY timestamp DESC`);
        return this.mapResults(r);
    }

    public async getById(id: string): Promise<JournalEntry | null> {
        // Fix: Use type::thing and explicit fields
        const r = await dbCore.query<JournalEntry>(`SELECT ${this.FIELDS} FROM type::thing('projects', $id)`, { id });
        return r.length ? this.mapResult(r[0]) : null;
    }

    public async create(e: JournalEntry): Promise<void> {
        const op = this.getCreateOperation(e);
        await dbCore.query(op.query, op.params);
    }

    public getCreateOperation(e: JournalEntry) {
        // Fix: Use type::thing
        const sql = `CREATE type::thing('projects', $id) CONTENT $content`;
        const params = { id: e.id, content: e };
        return { query: sql, params };
    }

    public async save(e: JournalEntry): Promise<void> {
        const op = this.getSaveOperation(e);
        await dbCore.query(op.query, op.params);
    }

    /**
     * Returns the operation object for a save action (UPDATE), to be used in transactions.
     */
    public getSaveOperation(e: JournalEntry) {
        // Fix: Use type::thing
        const sql = `
            UPDATE type::thing('projects', $id) SET
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
            id: e.id,
            prompt: e.prompt,
            timestamp: e.timestamp,
            description: e.description ?? "Initializing...",
            files: e.files ?? [],
            tags: e.tags ?? [],
            mood: e.mood,
            sentimentScore: e.sentimentScore ?? 0,
            project: e.project ?? "",
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

    public async delete(id: string): Promise<void> {
        await dbCore.query("DELETE type::thing('projects', $id)", { id });
    }
}