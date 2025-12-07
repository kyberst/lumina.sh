
import { Session, Transaction } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class SessionRepository extends BaseRepository {
    
    public async create(s: Session) {
        // Upsert session
        await dbCore.query("UPDATE type::thing('sessions', $id) CONTENT $s", { id: s.id, s });
    }

    public async getByUser(userId: string): Promise<Session[]> {
        const r = await dbCore.query<Session>("SELECT id, userId, device, ip, lastActive FROM sessions WHERE userId = $userId ORDER BY lastActive DESC", { userId });
        return this.mapResults(r);
    }

    public async revoke(sessionId: string) {
        await dbCore.query("DELETE type::thing('sessions', $id)", { id: sessionId });
    }

    public async addTransaction(t: Transaction) {
        // Upsert transaction
        await dbCore.query("UPDATE type::thing('transactions', $id) CONTENT $t", { id: t.id, t });
    }

    public async getUserTransactions(userId: string): Promise<Transaction[]> {
        const r = await dbCore.query<Transaction>("SELECT id, userId, amount, credits, type, description, timestamp FROM transactions WHERE userId = $userId ORDER BY timestamp DESC", { userId });
        return this.mapResults(r);
    }
}
