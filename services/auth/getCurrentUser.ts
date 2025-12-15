
import { dbFacade } from '../dbFacade';
import { User } from '../../types';
import { authStorage } from './storage';
import { logout } from './logout';
import { startSessionMonitor } from './sessionMonitor';

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
        const currentSession = sessions.find(s => s.id === token);

        if (!currentSession) {
            console.warn('[Auth] Session invalid or revoked. Logging out.');
            await logout(); // Cleanup local state
            return null;
        }

        // Check if actually expired (and monitor missed it or app was closed)
        if (currentSession.expiresAt && Date.now() > currentSession.expiresAt) {
             console.warn('[Auth] Session expired.');
             await logout();
             return null;
        }

        // 3. Retrieve User Data
        const user = await dbFacade.getUserById(userId);
        if (!user) {
            await logout();
            return null;
        }

        // 4. Restart Silent Refresh Monitor
        // Use DB expiry or fallback to 1h from now if missing (legacy data)
        const expiry = currentSession.expiresAt || (Date.now() + 3600000);
        startSessionMonitor(expiry);

        return user;
    } catch (e) {
        console.error('[Auth] Failed to restore session', e);
        return null;
    }
};
