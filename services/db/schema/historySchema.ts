
/**
 * History Schema Definitions.
 * Contiene las sentencias SQL para el historial de chat y snapshots de código.
 */

export const createHistoryTables = (db: any, isUpdate: boolean) => {
    // Historial lineal del Chat
    db.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY, 
            role TEXT, 
            text TEXT, 
            timestamp INTEGER
        );
    `);

    // Historial de Refactorización (Snapshots y Diffs)
    db.run(`
        CREATE TABLE IF NOT EXISTS refactor_history (
            id TEXT PRIMARY KEY, 
            project_id TEXT, 
            role TEXT, 
            text TEXT, 
            timestamp INTEGER, 
            snapshot TEXT, 
            reasoning TEXT, 
            requiredEnvVars TEXT, 
            modifiedFiles TEXT
        );
    `);

    // Migraciones para actualizaciones de estructura en DB existente
    if (isUpdate) {
        try { db.run("ALTER TABLE refactor_history ADD COLUMN reasoning TEXT"); } catch (e) { }
        try { db.run("ALTER TABLE projects ADD COLUMN envVars TEXT"); } catch (e) { }
        try { db.run("ALTER TABLE projects ADD COLUMN dependencies TEXT"); } catch (e) { }
        try { db.run("ALTER TABLE refactor_history ADD COLUMN requiredEnvVars TEXT"); } catch (e) { }
        try { db.run("ALTER TABLE refactor_history ADD COLUMN modifiedFiles TEXT"); } catch (e) { }
    }
};
