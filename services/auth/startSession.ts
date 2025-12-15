
import { dbFacade } from '../dbFacade';
import { Session } from '../../types';

const SESSION_KEY = 'dyad_session_user_id';
const SESSION_ID_KEY = 'dyad_session_id';

export const startSession = async (userId: string) => {
    localStorage.setItem(SESSION_KEY, userId);

    const sessionId = crypto.randomUUID();
    const session: Session = {
        id: sessionId,
        userId,
        device: navigator.userAgent, // Simplified
        ip: '127.0.0.1', // Mocked for local-first
        lastActive: Date.now()
    };
    await dbFacade.createSession(session);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
};
