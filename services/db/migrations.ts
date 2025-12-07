
import { createAuthTables } from './schema/authSchema';
import { createAppTables } from './schema/appSchema';
import { createHistoryTables } from './schema/historySchema';
import { logger } from '../logger';
import { AppModule } from '../../types';

const LATEST_VERSION = 1;

interface Migration {
    version: number;
    description: string;
    up: (db: any) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
    {
        version: 1,
        description: 'Initial Schema Setup (Auth, App, History)',
        up: async (db) => {
            await createAuthTables(db);
            await createAppTables(db);
            await createHistoryTables(db, false);
        }
    }
    // Future migrations example:
    // {
    //    version: 2,
    //    description: 'Add Vector Index to Memories',
    //    up: async (db) => { ... }
    // }
];

export const runMigrations = async (dbCore: any) => {
    try {
        let currentVersion = 0;
        
        // 1. Check current version from DB
        try {
            // Access app_config table directly via raw query to get version
            // Fix: Select specific record directly using ID syntax (table:id)
            // Fix: Use SELECT * to avoid conflict with 'value' keyword
            const result: any[] = await dbCore.query("SELECT * FROM app_config:db_version");
            if (result && result.length > 0 && result[0].value) {
                currentVersion = result[0].value;
            }
        } catch (e) {
            // Table might not exist yet on fresh install, default to 0
            currentVersion = 0;
        }

        logger.info(AppModule.CORE, `DB Migration Check: Current v${currentVersion} | Target v${LATEST_VERSION}`);

        if (currentVersion >= LATEST_VERSION) {
            return;
        }

        // 2. Run pending migrations
        for (const migration of MIGRATIONS) {
            if (migration.version > currentVersion) {
                logger.info(AppModule.CORE, `Applying Migration v${migration.version}: ${migration.description}`);
                
                await migration.up(dbCore);
                
                // 3. Update version
                await dbCore.query("UPDATE type::thing('app_config', 'db_version') CONTENT { value: $v, timestamp: time::now() }", { v: migration.version });
                
                logger.info(AppModule.CORE, `Migration v${migration.version} Success`);
            }
        }
    } catch (e: any) {
        logger.error(AppModule.CORE, "Critical: Database Migration Failed", e);
        throw e; // Stop app initialization
    }
};
