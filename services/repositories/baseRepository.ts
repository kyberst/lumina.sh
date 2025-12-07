
/**
 * Base Repository Class.
 * Simplified for SurrealDB which returns JSON objects directly.
 */
export class BaseRepository {
    
    /** 
     * Normalizes SurrealDB ID (table:id) to simple string ID if needed.
     * For this app, we largely treat IDs as opaque strings, so minimal processing is required.
     */
    protected mapResult<T>(res: any): T {
        return res as T;
    }

    protected mapResults<T>(res: any[]): T[] {
        if (!Array.isArray(res)) return [];
        return res as T[];
    }
}