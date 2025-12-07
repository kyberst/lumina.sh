
import { User } from '../../types';
import { dbCore } from '../db/dbCore';
import { BaseRepository } from './baseRepository';

export class UserRepository extends BaseRepository {
    
    public async getByEmail(email: string): Promise<User | null> {
        const r = await dbCore.query<User>("SELECT id, email, name, passwordHash, avatar, credits, twoFactorEnabled, createdAt FROM users WHERE email = $email", { email });
        return r.length ? this.mapResult(r[0]) : null;
    }

    public async getById(id: string): Promise<User | null> {
        const r = await dbCore.query<User>("SELECT id, email, name, passwordHash, avatar, credits, twoFactorEnabled, createdAt FROM users WHERE id = <string>$id", { id });
        return r.length ? this.mapResult(r[0]) : null;
    }

    public async create(u: User): Promise<void> {
        // Use UPDATE for Upsert behavior to avoid "Record already exists" errors
        await dbCore.query("UPDATE type::thing('users', $id) CONTENT $u", { id: u.id, u });
    }

    public async update(u: User): Promise<void> {
        await dbCore.query("UPDATE type::thing('users', $id) CONTENT $u", { id: u.id, u });
    }
}
