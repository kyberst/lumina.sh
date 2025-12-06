
/**
 * Base Repository Class.
 * Provee utilidades comunes para mapear resultados de SQL.js a objetos JS.
 */
export class BaseRepository {
    
    /** Convierte el formato crudo de SQL.js ([val1, val2]) a objeto ({col1: val1}) */
    protected mapRow(res: any): any {
        if (!res || !res.values || !res.values.length) return null;
        return this.mapVal(res.columns, res.values[0]);
    }

    /** Convierte múltiples filas */
    protected mapRows(res: any): any[] {
        if (!res || !res.values) return [];
        return res.values.map((v: any[]) => this.mapVal(res.columns, v));
    }

    /** Helper interno de mapeo columna-valor */
    private mapVal(cols: string[], vals: any[]) {
        const o: any = {};
        cols.forEach((c, i) => o[c] = vals[i]);
        return o;
    }
}
