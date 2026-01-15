
export const createAppTables = async (db: any) => {
    // Definición de tablas principales
    await db.query(`
        DEFINE TABLE IF NOT EXISTS app_config SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS projects SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS refactor_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS chat_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS logs SCHEMALESS;
        
        -- ANCLAJES Y PREFERENCIAS
        DEFINE TABLE IF NOT EXISTS user_preferences SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS project_anchors SCHEMALESS;
        DEFINE INDEX IF NOT EXISTS anchor_project_idx ON project_anchors COLUMNS project_id;

        -- SEGURIDAD DE INTEGRACIONES (NUEVO)
        DEFINE TABLE IF NOT EXISTS project_secrets SCHEMALESS;
        DEFINE INDEX IF NOT EXISTS secret_project_idx ON project_secrets COLUMNS project_id;

        -- SISTEMA DE MEMORIA VECTORIAL + FTS
        DEFINE TABLE IF NOT EXISTS memories SCHEMALESS;
        DEFINE ANALYZER IF NOT EXISTS technical_analyzer TOKENIZERS blank,class,camel FILTERS lowercase,snowball(english);
        DEFINE INDEX IF NOT EXISTS memory_project_idx ON memories COLUMNS project_id;
        DEFINE INDEX IF NOT EXISTS memory_fts_idx ON memories COLUMNS function_names, variable_definitions, content SEARCH ANALYZER technical_analyzer;
        DEFINE FIELD IF NOT EXISTS embedding ON memories TYPE array<float>;
    `);
};
