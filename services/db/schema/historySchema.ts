
export const createHistoryTables = async (db: any, isUpdate: boolean) => {
    // Define Table for Memories
    // Note: Vector Indexing (HNSW) is skipped as it requires SurrealDB 1.3+ WASM engine
    // We will use exact nearest neighbor search (Brute force) which is performant for local datasets.
    try {
        await db.query(`
            DEFINE TABLE memories SCHEMALESS;
        `);
    } catch (e) {
        console.warn("Table creation warning", e);
    }
};
