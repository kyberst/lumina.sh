
/**
 * Base Repository Class.
 * Normalizes how IDs and results are handled across repositories.
 * Renames database 'id' to application-friendly 'uid' or 'mid'.
 */
export class BaseRepository {
    
    /** 
     * Normalizes a single result from SurrealDB.
     * Ensures primary ID is extracted as a clean string UUID and renamed.
     */
    protected mapResult<T>(res: any, idKey: 'uid' | 'mid' = 'uid'): T {
        if (!res || typeof res !== 'object') return res;
        
        // Handle "wrapped" objects from transactions if necessary
        let data = res;
        if (res["0"] !== undefined && (res.id === "" || res.id === undefined)) {
            data = res["0"];
        }
        
        // Extract raw ID from common fields
        const rawId = data.id !== undefined ? data.id : (data.uid !== undefined ? data.uid : data.mid);
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
        
        // Also ensure project relations use the clean uid string
        if (normalized.project_id) {
            normalized.project_uid = this.cleanId(normalized.project_id);
            delete normalized.project_id;
        }
        
        return normalized as T;
    }

    protected mapResults<T>(res: any[], idKey: 'uid' | 'mid' = 'uid'): T[] {
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
