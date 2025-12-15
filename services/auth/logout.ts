
import { dbFacade } from '../dbFacade';
import { authStorage } from './storage';

export const logout = async () => {
    const token = authStorage.getToken();
    
    // Revoke server-side if token exists
    if (token) {
        try {
            await dbFacade.revokeSession(token);
        } catch (e) {
            console.warn('[Auth] Failed to revoke session on server', e);
        }
    }

    // Clear local persistence
    authStorage.clear();
};
