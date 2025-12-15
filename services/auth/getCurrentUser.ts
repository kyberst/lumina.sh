
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { authStorage } from './storage';
import { logout } from './logout';

/**
 * Deterministic Session Refresh.
 * Checks for token existence and validity against the database on startup.
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const userId = authStorage.getUserId();
    const token = authStorage.getToken();

    // 1. Fast fail if no local data
    if (!userId || !token) {
        return null;
    }

    try {
        // 2. Validate Session against DB (Server-side check simulation)
        // Ensure the session hasn't been revoked
        const sessions = await dbFacade.getUserSessions(userId);
        const isValidSession = sessions.some(s => s.id === token);

        if (!isValidSession) {
            console.warn('[Auth] Session invalid or revoked. Logging out.');
            await logout(); // Cleanup local state
            return null;
        }

        // 3. Retrieve User Data
        const user = await dbFacade.getUserById(userId);
        if (!user) {
            await logout();
            return null;
        }

        return user;
    } catch (e) {
        console.error('[Auth] Failed to restore session', e);
        return null;
    }
};
