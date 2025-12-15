
import { dbFacade } from '../dbFacade';

const SESSION_KEY = 'dyad_session_user_id';
const SESSION_ID_KEY = 'dyad_session_id';

export const logout = async () => {
    const sid = localStorage.getItem(SESSION_ID_KEY);
    if (sid) await dbFacade.revokeSession(sid);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
};
