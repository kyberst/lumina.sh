
/**
 * Auth Schema Definitions.
 * Contiene las sentencias SQL para crear tablas relacionadas con usuarios y seguridad.
 */

export const createAuthTables = (db: any) => {
    // Tabla de Usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, 
            email TEXT UNIQUE, 
            name TEXT, 
            passwordHash TEXT, 
            avatar TEXT, 
            credits INTEGER, 
            twoFactorEnabled INTEGER, 
            createdAt INTEGER
        );
    `);

    // Tabla de Sesiones Activas
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, 
            userId TEXT, 
            device TEXT, 
            ip TEXT, 
            lastActive INTEGER
        );
    `);

    // Tabla de Transacciones Financieras/Créditos
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY, 
            userId TEXT, 
            amount REAL, 
            credits INTEGER, 
            type TEXT, 
            description TEXT, 
            timestamp INTEGER
        );
    `);
};
