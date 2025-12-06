
import { Session, Transaction } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

/**
 * Session & Transaction Repository.
 * Maneja datos volátiles de sesión y registros financieros.
 */
export class SessionRepository extends BaseRepository {
    
    // --- Sessions ---
    public async create(s: Session) {
        dbCore.run("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)", [s.id, s.userId, s.device, s.ip, s.lastActive]);
    }

    public async getByUser(userId: string): Promise<Session[]> {
        const r = dbCore.exec("SELECT * FROM sessions WHERE userId = ? ORDER BY lastActive DESC", [userId]);
        return r.length ? this.mapRows(r[0]) : [];
    }

    public async revoke(sessionId: string) {
        dbCore.run("DELETE FROM sessions WHERE id = ?", [sessionId]);
    }

    // --- Transactions ---
    public async addTransaction(t: Transaction) {
        dbCore.run("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?)", 
          [t.id, t.userId, t.amount, t.credits, t.type, t.description, t.timestamp]);
    }

    public async getUserTransactions(userId: string): Promise<Transaction[]> {
        const r = dbCore.exec("SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC", [userId]);
        return r.length ? this.mapRows(r[0]) : [];
    }
}
