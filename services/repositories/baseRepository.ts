/**
 * Base Repository Class.
 * Normalizes how IDs and results are handled across repositories.
 * Maps database 'id' to application-friendly 'tableName_id'.
 */
export class BaseRepository {
    
    /** 
     * Normalizes a single result from SurrealDB.
     * Ensures primary ID is extracted as a clean string UUID and renamed.
     */
    protected mapResult<T>(res: any, idKey: string): T {
        if (!res || typeof res !== 'object') return res;
        
        // Handle "wrapped" objects from transactions if necessary
        let data = res;
        if (res["0"] !== undefined && (res.id === "" || res.id === undefined)) {
            data = res["0"];
        }
        
        // Extract raw ID from potential source fields
        const rawId = data.id !== undefined ? data.id : data[idKey];
        const cleanIdString = this.cleanId(rawId);
        
        const normalized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key) && key !== "0") {
                normalized[key] = data[key];
            }
        }

        // Set the application-level ID key and remove the DB-level 'id'
        normalized[idKey] = cleanIdString;
        if (normalized.id) delete normalized.id;
        
        // Handle related fields naming if they were using old conventions
        if (normalized.project_id) {
            normalized.projects_id = this.cleanId(normalized.project_id);
            delete normalized.project_id;
        }
        if (normalized.project_uid) {
            normalized.projects_id = this.cleanId(normalized.project_uid);
            delete normalized.project_uid;
        }
        
        return normalized as T;
    }

    protected mapResults<T>(res: any[], idKey: string): T[] {
        if (!Array.isArray(res)) return [];
        return res.map(item => this.mapResult<T>(item, idKey));
    }

    /**
     * Extracts the clean UUID part from a RecordID.
     */
    public cleanId(id: any): string {
        if (id === null || id === undefined) return '';
        if (typeof id === 'string') {
            if (id === '' || id === '[object Object]') return '';
            const index = id.indexOf(':');
            let val = index !== -1 ? id.substring(index + 1) : id;
            return val.replace(/[⟨⟩]/g, '');
        }
        if (typeof id === 'object' && id.id !== undefined) {
            return this.cleanId(id.id);
        }
        return String(id);
    }
}