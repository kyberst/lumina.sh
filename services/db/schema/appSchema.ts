
export const createAppTables = async (db: any) => {
    // Definición de tablas principales
    await db.query(`
        DEFINE TABLE IF NOT EXISTS app_config SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS projects SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS refactor_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS chat_history SCHEMALESS;
        DEFINE TABLE IF NOT EXISTS logs SCHEMALESS;
        
        -- ÍNDICES CRÍTICOS PARA RENDIMIENTO (ESTILO DYAD)
        -- Optimiza el filtrado para la barra lateral y listas de proyectos
        DEFINE INDEX IF NOT EXISTS project_status_idx ON projects COLUMNS status;
        
        -- Optimiza la búsqueda de mensajes vinculados a un proyecto (Carga de Workspace)
        DEFINE INDEX IF NOT EXISTS refactor_project_idx ON refactor_history COLUMNS project_id;
        
        -- Optimiza la ordenación cronológica por proyecto
        DEFINE INDEX IF NOT EXISTS refactor_timestamp_idx ON refactor_history COLUMNS project_id, timestamp;

        -- Sistema de Memoria Vectorial para RAG
        DEFINE TABLE IF NOT EXISTS memories SCHEMALESS;
        DEFINE FIELD IF NOT EXISTS embedding ON memories TYPE array<float>;
        DEFINE FIELD IF NOT EXISTS project_id ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS type ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS content ON memories TYPE string;
        DEFINE FIELD IF NOT EXISTS metadata ON memories TYPE object;
        DEFINE FIELD IF NOT EXISTS timestamp ON memories TYPE number;

        -- Índice para filtrado rápido de memorias por proyecto
        DEFINE INDEX IF NOT EXISTS memory_project_idx ON memories COLUMNS project_id;
    `);
};
