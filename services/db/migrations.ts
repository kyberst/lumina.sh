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
        description: 'Set Initial DB Version',
        up: async (db) => {
            // Schema creation handled in dbCore.init
        }
    }
];

export const runMigrations = async (dbCore: any) => {
    try {
        let currentVersion = 0;
        
        // 1. Check current version from DB
        try {
            // Fix: Use SELECT id, value (Explicit) and type::thing
            const result: any[] = await dbCore.query("SELECT id, value FROM type::thing('app_config', 'db_version')");
            if (result && result.length > 0 && result[0].value) {
                currentVersion = Number(result[0].value);
            }
        } catch (e) {
            logger.warn(AppModule.CORE, "Could not read db_version, assuming v0.", e);
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
                
                // 3. Update version using type::thing
                const query = `UPDATE type::thing('app_config', 'db_version') SET value = $v, timestamp = time::now()`;
                await dbCore.query(query, { v: migration.version });
                
                logger.info(AppModule.CORE, `Migration v${migration.version} Success`);
            }
        }
    } catch (e: any) {
        logger.error(AppModule.CORE, "Critical: Database Migration Failed", e);
        throw e; // Stop app initialization
    }
};