
/**
 * Graph Schema Definition.
 * Implements a Relational Knowledge Graph structure.
 */
export const createGraphTables = async (db: any) => {
    await db.query(`
        -- Knowledge Nodes
        DEFINE TABLE IF NOT EXISTS graph_nodes SCHEMALESS;
        DEFINE FIELD IF NOT EXISTS project_id ON graph_nodes TYPE string;
        DEFINE FIELD IF NOT EXISTS name ON graph_nodes TYPE string;
        DEFINE FIELD IF NOT EXISTS kind ON graph_nodes TYPE string; -- 'file', 'feature', 'tech'
        DEFINE FIELD IF NOT EXISTS content ON graph_nodes TYPE string;

        DEFINE INDEX IF NOT EXISTS node_name_idx ON graph_nodes COLUMNS project_id, name;

        -- Import Relationship (The Topology Edge)
        DEFINE TABLE IF NOT EXISTS imports SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS in ON imports TYPE record<graph_nodes>;
        DEFINE FIELD IF NOT EXISTS out ON imports TYPE record<graph_nodes>;
        
        -- Relates nodes to specific chat messages
        DEFINE TABLE IF NOT EXISTS mentioned_in SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS in ON mentioned_in TYPE record<graph_nodes>;
        DEFINE FIELD IF NOT EXISTS out ON mentioned_in TYPE record<refactor_history>;
    `);
};
