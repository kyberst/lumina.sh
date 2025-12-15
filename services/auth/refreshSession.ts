
import { dbFacade } from '../dbFacade';
import { authStorage } from './storage';

/**
 * silently refreshes the current session by extending its expiration time.
 * In a real backend, this would hit /auth/refresh and get a new JWT.
 */
export const refreshSession = async (): Promise<number | null> => {
    const sessionId = authStorage.getToken();
    if (!sessionId) return null;

    // Extend by 1 hour (3600000 ms) from now
    const newExpiresAt = Date.now() + 3600000;
    
    try {
        await dbFacade.extendSession(sessionId, newExpiresAt);
        console.debug('[Auth] Session refreshed silently.');
        return newExpiresAt;
    } catch (e) {
        console.warn('[Auth] Failed to refresh session', e);
        return null;
    }
};
