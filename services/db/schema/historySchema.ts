
export const createHistoryTables = async (db: any, isUpdate: boolean) => {
    // Define Table for Memories
    // Note: Vector Indexing (HNSW) is skipped as it requires SurrealDB 1.3+ WASM engine
    // We will use exact nearest neighbor search (Brute force) which is performant for local datasets.
    
    // The WASM version of SurrealDB might not support `IF NOT EXISTS` in `DEFINE TABLE`.
    // We'll wrap it in a try/catch to handle cases where the table already exists.
    try {
        await db.query(`DEFINE TABLE memories SCHEMALESS;`);
    } catch (e: any) {
        if (e.message && e.message.includes('already exists')) {
            // Table already exists, which is fine.
        } else {
            // Re-throw any other unexpected errors.
            throw e;
        }
    }
};
