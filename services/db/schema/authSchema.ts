
export const createAuthTables = async (db: any) => {
    // SurrealDB is schemaless by default, but we can define permissions or indexes.
    // Defining User Email Index for uniqueness
    await db.query(`DEFINE INDEX user_email ON TABLE users COLUMNS email UNIQUE;`);
};