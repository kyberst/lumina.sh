
export const runMigrations = (db: any, isUpdate: boolean) => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, passwordHash TEXT, avatar TEXT, credits INTEGER, twoFactorEnabled INTEGER, createdAt INTEGER);`);
    db.run(`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, userId TEXT, amount REAL, credits INTEGER, type TEXT, description TEXT, timestamp INTEGER);`);
    db.run(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, prompt TEXT, timestamp INTEGER, description TEXT, files TEXT, tags TEXT, mood INTEGER, sentimentScore REAL, project TEXT, contextSource TEXT, envVars TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS chat_history (id TEXT PRIMARY KEY, role TEXT, text TEXT, timestamp INTEGER);`);
    db.run(`CREATE TABLE IF NOT EXISTS refactor_history (id TEXT PRIMARY KEY, project_id TEXT, role TEXT, text TEXT, timestamp INTEGER, snapshot TEXT, reasoning TEXT, requiredEnvVars TEXT, modifiedFiles TEXT);`);
    db.run(`CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT);`);
    
    if (isUpdate) {
      try { db.run("ALTER TABLE refactor_history ADD COLUMN reasoning TEXT"); } catch (e) { }
      try { db.run("ALTER TABLE projects ADD COLUMN envVars TEXT"); } catch (e) { }
      try { db.run("ALTER TABLE refactor_history ADD COLUMN requiredEnvVars TEXT"); } catch (e) { }
      try { db.run("ALTER TABLE refactor_history ADD COLUMN modifiedFiles TEXT"); } catch (e) { }
    }
};
