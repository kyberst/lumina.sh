
import { dbFacade } from '../dbFacade';
import { Session } from '../../types';
import { authStorage } from './storage';
import { startSessionMonitor } from './sessionMonitor';

/**
 * Starts a new authenticated session.
 * @param userId The user ID to log in.
 * @param rememberMe If true, uses localStorage. If false, uses sessionStorage.
 */
export const startSession = async (userId: string, rememberMe: boolean = true) => {
    // 1. Persist User Context locally
    authStorage.setUserId(userId, rememberMe);

    // 2. Generate Secure Session Token
    const sessionId = crypto.randomUUID();
    
    // 3. Register Session in Database
    // Shorter expiry if not remembering (e.g., 24h vs 30 days logic could be applied here if DB supported it)
    const session: Session = {
        id: sessionId,
        userId,
        device: navigator.userAgent,
        ip: '127.0.0.1', // Local-first mock IP
        lastActive: Date.now(),
        expiresAt: Date.now() + (rememberMe ? 30 * 24 * 3600000 : 24 * 3600000) // 30 days vs 1 day validity
    };
    await dbFacade.createSession(session);

    // 4. Persist Token securely based on preference
    authStorage.setToken(sessionId, rememberMe);

    // 5. Start Silent Refresh Monitor
    startSessionMonitor(session.expiresAt);
};
