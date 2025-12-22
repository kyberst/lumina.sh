import { JournalEntry } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class ProjectRepository extends BaseRepository {
    
    // Explicitly define all needed fields, mapping id to projects_id
    private readonly FIELDS = "meta::id(id) AS projects_id, prompt, timestamp, description, files, tags, mood, sentimentScore, project, pendingGeneration, contextSource, envVars, dependencies, requiredEnvVars, installCommand, startCommand";

    public async getAll(): Promise<JournalEntry[]> {
        const r = await dbCore.query<JournalEntry>(`SELECT ${this.FIELDS} FROM projects ORDER BY timestamp DESC`);
        return this.mapResults(r, 'projects_id');
    }

    public async getById(projects_id: string): Promise<JournalEntry | null> {
        const cleanId = this.cleanId(projects_id);
        if (!cleanId) return null;
        
        const r = await dbCore.query<JournalEntry>(
            `SELECT ${this.FIELDS} FROM projects WHERE id = type::thing('projects', $id)`, 
            { id: cleanId }
        );
        return r.length ? this.mapResult(r[0], 'projects_id') : null;
    }

    public async create(e: JournalEntry): Promise<void> {
        const op = this.getCreateOperation(e);
        await dbCore.query(op.query, op.params);
    }

    public getCreateOperation(e: JournalEntry) {
        const cleanId = this.cleanId(e.projects_id);
        if (!cleanId) throw new Error("projects_id is missing for creation.");

        const { projects_id, ...content } = e;
        
        return { 
            query: `CREATE type::thing('projects', $id) CONTENT $content`, 
            params: { id: cleanId, content } 
        };
    }

    public async save(e: JournalEntry): Promise<void> {
        const op = this.getSaveOperation(e);
        await dbCore.query(op.query, op.params);
    }

    public getSaveOperation(e: JournalEntry) {
        const cleanId = this.cleanId(e.projects_id);
        if (!cleanId) throw new Error("Cannot save project without a valid projects_id.");

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
            id: cleanId,
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

    public async delete(projects_id: string): Promise<void> {
        const cleanId = this.cleanId(projects_id);
        if (!cleanId) return;
        await dbCore.query("DELETE projects WHERE id = type::thing('projects', $id)", { id: cleanId });
    }
}