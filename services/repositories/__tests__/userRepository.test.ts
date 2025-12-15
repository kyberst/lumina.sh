
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserRepository } from '../userRepository';
import { dbCore } from '../../db/dbCore';
import { User } from '../../../types';

describe('UserRepository (Integration)', () => {
  const repo = new UserRepository();

  beforeAll(async () => {
    // Initialize DB (will fallback to mem:// in test environment if indexedDB missing)
    await dbCore.init();
  });

  it('should create and retrieve a user', async () => {
    const user: User = {
      id: 'u:1',
      name: 'Integration Tester',
      email: 'tester@test.com',
      passwordHash: 'hash',
      credits: 100,
      twoFactorEnabled: false,
      createdAt: Date.now(),
      telemetryConsent: false
    };

    await repo.create(user);

    const fetched = await repo.getByEmail('tester@test.com');
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Integration Tester');
    expect(fetched?.id).toBe('u:1');
  });

  it('should update a user', async () => {
    const user = await repo.getByEmail('tester@test.com');
    if (!user) throw new Error("User not found for update test");

    user.credits = 50;
    await repo.update(user);

    const updated = await repo.getByEmail('tester@test.com');
    expect(updated?.credits).toBe(50);
  });

  it('should return null for non-existent user', async () => {
    const fetched = await repo.getByEmail('nobody@nowhere.com');
    expect(fetched).toBeNull();
  });
});