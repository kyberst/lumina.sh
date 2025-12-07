
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';
import { dbFacade } from '../dbFacade';
import { User } from '../../types';

// Mock the DB layer to test business logic in isolation
vi.mock('../dbFacade', () => ({
  dbFacade: {
    getUser: vi.fn(),
    getUserById: vi.fn(),
    createUser: vi.fn(),
    createSession: vi.fn(),
    addTransaction: vi.fn(),
    revokeSession: vi.fn()
  }
}));

// Mock Toast to prevent UI side effects in tests
vi.mock('../toastService', () => ({
  toast: { info: vi.fn(), error: vi.fn() }
}));

describe('AuthService (Contract/Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should login successfully with correct credentials', async () => {
    const mockUser: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test',
      passwordHash: btoa('password123'),
      credits: 10,
      twoFactorEnabled: false,
      createdAt: Date.now()
    };

    vi.mocked(dbFacade.getUser).mockResolvedValue(mockUser);

    const result = await authService.login('test@example.com', 'password123');
    
    expect(result.user).toEqual(mockUser);
    expect(result.require2FA).toBe(false);
    expect(dbFacade.createSession).toHaveBeenCalled();
  });

  it('should fail login with incorrect password', async () => {
    const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test',
        passwordHash: btoa('password123'), // Encoded 'password123'
        credits: 10,
        twoFactorEnabled: false,
        createdAt: Date.now()
    };

    vi.mocked(dbFacade.getUser).mockResolvedValue(mockUser);

    await expect(authService.login('test@example.com', 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
  });

  it('should require 2FA if enabled', async () => {
    const mockUser: User = {
        id: '123',
        email: 'secure@example.com',
        name: 'Secure',
        passwordHash: btoa('password123'),
        credits: 10,
        twoFactorEnabled: true,
        createdAt: Date.now()
    };

    vi.mocked(dbFacade.getUser).mockResolvedValue(mockUser);

    const result = await authService.login('secure@example.com', 'password123');
    expect(result.user).toBeNull();
    expect(result.require2FA).toBe(true);
  });
});
