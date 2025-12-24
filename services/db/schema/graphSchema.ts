
/**
 * Graph Schema Definition.
 * Implements a Relational Knowledge Graph structure to store software entities,
 * user preferences, and architectural dependencies.
 */
export const createGraphTables = async (db: any) => {
    await db.query(`
        -- Knowledge Nodes (Soft entities)
        DEFINE TABLE IF NOT EXISTS graph_nodes SCHEMALESS;
        DEFINE FIELD IF NOT EXISTS project_id ON graph_nodes TYPE string;
        DEFINE FIELD IF NOT EXISTS name ON graph_nodes TYPE string;
        DEFINE FIELD IF NOT EXISTS kind ON graph_nodes TYPE string; -- 'feature', 'tech', 'preference', 'requirement'
        DEFINE FIELD IF NOT EXISTS summary ON graph_nodes TYPE string;

        DEFINE INDEX IF NOT EXISTS node_name_idx ON graph_nodes COLUMNS project_id, name;
        DEFINE INDEX IF NOT EXISTS node_kind_idx ON graph_nodes COLUMNS project_id, kind;

        -- Relations (Semantic Edges)
        DEFINE TABLE IF NOT EXISTS depends_on SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS in ON depends_on TYPE record<graph_nodes>;
        DEFINE FIELD IF NOT EXISTS out ON depends_on TYPE record<graph_nodes>;
        DEFINE FIELD IF NOT EXISTS strength ON depends_on TYPE float DEFAULT 1.0;
        
        -- Relates nodes to specific chat messages (Refactor turns)
        DEFINE TABLE IF NOT EXISTS mentioned_in SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS in ON mentioned_in TYPE record<graph_nodes>;
        DEFINE FIELD IF NOT EXISTS out ON mentioned_in TYPE record<refactor_history>;
    `);
};
