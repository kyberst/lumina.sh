
import { dbFacade } from '../dbFacade';
import { authStorage } from './storage';

/**
 * Silently checks if the current local session is valid on the server/database.
 * Does not extend the session, just verifies existence and expiry.
 * Returns true if valid, false if expired or invalid.
 */
export const validateSession = async (): Promise<boolean> => {
    const token = authStorage.getToken();
    const userId = authStorage.getUserId();

    if (!token || !userId) return false;

    try {
        // Retrieve active sessions for the user
        const sessions = await dbFacade.getUserSessions(userId);
        const currentSession = sessions.find(s => s.id === token);

        if (!currentSession) {
            return false; // Session revoked or not found
        }

        if (currentSession.expiresAt < Date.now()) {
            return false; // Session expired
        }

        return true;
    } catch (e) {
        console.warn('[Auth] Session validation failed', e);
        return false; // Fail safe
    }
};
