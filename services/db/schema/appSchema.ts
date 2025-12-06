
/**
 * App Domain Schema Definitions.
 * Contiene las sentencias SQL para el núcleo de la aplicación (Proyectos, Configuración).
 */

export const createAppTables = (db: any) => {
    // Tabla Principal de Proyectos (Journal Entries)
    db.run(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY, 
            prompt TEXT, 
            timestamp INTEGER, 
            description TEXT, 
            files TEXT, 
            tags TEXT, 
            mood INTEGER, 
            sentimentScore REAL, 
            project TEXT, 
            contextSource TEXT, 
            envVars TEXT, 
            dependencies TEXT
        );
    `);

    // Configuración Global de la App (Key-Value Store)
    db.run(`
        CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY, 
            value TEXT
        );
    `);
};
