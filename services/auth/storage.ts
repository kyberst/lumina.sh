
/**
 * Auth Storage: Centralized manager for persistence.
 * Ensures consistent key usage and provides a single point for storage security upgrades.
 */

const KEYS = {
    TOKEN: 'lumina_session_token',
    USER_ID: 'lumina_user_id'
};

export const authStorage = {
    /** Save session token securely */
    setToken: (token: string) => localStorage.setItem(KEYS.TOKEN, token),
    
    /** Retrieve current session token */
    getToken: () => localStorage.getItem(KEYS.TOKEN),
    
    /** Save active user ID */
    setUserId: (id: string) => localStorage.setItem(KEYS.USER_ID, id),
    
    /** Retrieve active user ID */
    getUserId: () => localStorage.getItem(KEYS.USER_ID),
    
    /** Clear all auth data (Logout) */
    clear: () => {
        localStorage.removeItem(KEYS.TOKEN);
        localStorage.removeItem(KEYS.USER_ID);
    }
};
