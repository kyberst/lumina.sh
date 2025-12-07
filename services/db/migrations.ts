
import { createAuthTables } from './schema/authSchema';
import { createAppTables } from './schema/appSchema';
import { createHistoryTables } from './schema/historySchema';

export const runMigrations = async (dbCore: any) => {
    await createAuthTables(dbCore);
    await createAppTables(dbCore);
    await createHistoryTables(dbCore, false);
};