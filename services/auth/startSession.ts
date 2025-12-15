
import { dbFacade } from '../dbFacade';
import { Session } from '../../types';
import { authStorage } from './storage';

/**
 * Starts a new authenticated session.
 * Persists token immediately to ensure deterministic login state.
 */
export const startSession = async (userId: string) => {
    // 1. Persist User Context locally
    authStorage.setUserId(userId);

    // 2. Generate Secure Session Token
    const sessionId = crypto.randomUUID();
    
    // 3. Register Session in Database
    const session: Session = {
        id: sessionId,
        userId,
        device: navigator.userAgent,
        ip: '127.0.0.1', // Local-first mock IP
        lastActive: Date.now()
    };
    await dbFacade.createSession(session);

    // 4. Persist Token securely
    authStorage.setToken(sessionId);
};
