
export const createAuthTables = async (db: any) => {
    // Ensure the users table exists before defining an index on it.
    // The WASM version of SurrealDB might not support `IF NOT EXISTS` in `DEFINE TABLE`.
    // We'll wrap it in a try/catch to handle cases where the table already exists.
    try {
        await db.query(`DEFINE TABLE users SCHEMALESS;`);
    } catch (e: any) {
        // This error is expected if the table already exists.
        if (e.message && e.message.includes('already exists')) {
            // Table already exists, which is fine.
        } else {
            // Re-throw any other unexpected errors.
            throw e;
        }
    }

    // Defining User Email Index for uniqueness.
    // We wrap this in a try/catch because `DEFINE INDEX` is not idempotent and will
    // throw an error if the index already exists on subsequent app loads.
    try {
        await db.query(`DEFINE INDEX user_email ON TABLE users COLUMNS email UNIQUE;`);
    } catch (e: any) {
        // This error is expected if the migration has already run. We can safely ignore it.
        if (e.message && e.message.includes('already exists')) {
            // Index already exists, which is fine.
        } else {
            // Re-throw any other unexpected errors.
            throw e;
        }
    }
};
