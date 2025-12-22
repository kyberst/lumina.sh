
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
            // Initial schema is handled in createAppTables
        }
    }
];

export const runMigrations = async (dbCore: any) => {
    try {
        let currentVersion = 0;
        
        // Check current version using explicit fields and safe WHERE clause
        try {
            const result: any[] = await dbCore.query(
                "SELECT config_val FROM app_config WHERE id = type::thing('app_config', 'db_version')"
            );
            if (result && result.length > 0 && result[0].config_val) {
                currentVersion = Number(result[0].config_val);
            }
        } catch (e) {
            logger.warn(AppModule.CORE, "Could not read db_version, assuming v0.", e);
            currentVersion = 0;
        }

        if (currentVersion >= LATEST_VERSION) return;

        for (const migration of MIGRATIONS) {
            if (migration.version > currentVersion) {
                logger.info(AppModule.CORE, `Applying Migration v${migration.version}: ${migration.description}`);
                
                await migration.up(dbCore);
                
                // Update version using non-reserved field name
                await dbCore.query(
                    "UPDATE type::thing('app_config', 'db_version') SET config_val = $v, mtime = time::now()", 
                    { v: migration.version }
                );
            }
        }
    } catch (e: any) {
        logger.error(AppModule.CORE, "Critical: Database Migration Failed", e);
        throw e;
    }
};
