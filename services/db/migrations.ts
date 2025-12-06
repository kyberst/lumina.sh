
import { createAuthTables } from './schema/authSchema';
import { createAppTables } from './schema/appSchema';
import { createHistoryTables } from './schema/historySchema';

/**
 * Migration Orchestrator.
 * Ejecuta los scripts de creación de tablas en orden.
 * Separa responsabilidades por dominio (Auth, App, History).
 */
export const runMigrations = (db: any, isUpdate: boolean) => {
    // 1. Tablas de Identidad y Seguridad
    createAuthTables(db);
    
    // 2. Tablas del Núcleo de la Aplicación
    createAppTables(db);
    
    // 3. Tablas de Historial y Auditoría
    createHistoryTables(db, isUpdate);
};
