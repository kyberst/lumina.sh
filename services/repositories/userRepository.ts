
import { User } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

/**
 * User Repository.
 * Maneja CRUD exclusivo para la entidad User.
 */
export class UserRepository extends BaseRepository {
    
    public async getByEmail(email: string): Promise<User | null> {
        const r = dbCore.exec("SELECT * FROM users WHERE email = ?", [email]);
        return r.length ? this.mapRow(r[0]) : null;
    }

    public async getById(id: string): Promise<User | null> {
        const r = dbCore.exec("SELECT * FROM users WHERE id = ?", [id]);
        return r.length ? this.mapRow(r[0]) : null;
    }

    public async create(u: User): Promise<void> {
        dbCore.run(
            `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.email, u.name, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled ? 1 : 0, u.createdAt]
        );
    }

    public async update(u: User): Promise<void> {
        dbCore.run(
            `UPDATE users SET name=?, email=?, passwordHash=?, avatar=?, credits=?, twoFactorEnabled=? WHERE id=?`,
            [u.name, u.email, u.passwordHash, u.avatar, u.credits, u.twoFactorEnabled ? 1 : 0, u.id]
        );
    }
}
