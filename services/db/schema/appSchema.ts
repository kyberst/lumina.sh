
export const createAppTables = async (db: any) => {
    // Define all tables used by the application
    await db.query(`
        DEFINE TABLE IF NOT EXISTS app_config SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS projects SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS refactor_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS chat_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS logs SCHEMALESS;
        
        -- Vector Memory System for Long-term Scalability
        DEFINE TABLE IF NOT EXISTS memories SCHEMALESS;
        
        -- Define fields explicitly for vector search optimization
        DEFINE FIELD IF NOT EXISTS embedding ON memories TYPE array<float>;
        DEFINE FIELD IF NOT EXISTS project_id ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS type ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS content ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS metadata ON memories TYPE object;
        DEFINE FIELD IF NOT EXISTS timestamp ON memories TYPE number;

        -- Define an index for faster lookups (Exact match on project_id)
        DEFINE INDEX IF NOT EXISTS memory_project_idx ON memories COLUMNS project_id;
    `);
};
