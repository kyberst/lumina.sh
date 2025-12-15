
/**
 * Auth Storage: Centralized manager for persistence.
 * Supports switching between localStorage (Persistent) and sessionStorage (Ephemeral).
 */

const KEYS = {
    TOKEN: 'lumina_session_token',
    USER_ID: 'lumina_user_id'
};

export const authStorage = {
    /** Save session token securely. persistent=true uses localStorage. */
    setToken: (token: string, persistent: boolean) => {
        const storage = persistent ? localStorage : sessionStorage;
        // Clear other storage to avoid duplicates/conflicts
        (persistent ? sessionStorage : localStorage).removeItem(KEYS.TOKEN);
        storage.setItem(KEYS.TOKEN, token);
    },
    
    /** Retrieve current session token from either storage */
    getToken: () => localStorage.getItem(KEYS.TOKEN) || sessionStorage.getItem(KEYS.TOKEN),
    
    /** Save active user ID */
    setUserId: (id: string, persistent: boolean) => {
        const storage = persistent ? localStorage : sessionStorage;
        (persistent ? sessionStorage : localStorage).removeItem(KEYS.USER_ID);
        storage.setItem(KEYS.USER_ID, id);
    },
    
    /** Retrieve active user ID from either storage */
    getUserId: () => localStorage.getItem(KEYS.USER_ID) || sessionStorage.getItem(KEYS.USER_ID),
    
    /** Clear all auth data (Logout) */
    clear: () => {
        localStorage.removeItem(KEYS.TOKEN);
        sessionStorage.removeItem(KEYS.TOKEN);
        localStorage.removeItem(KEYS.USER_ID);
        sessionStorage.removeItem(KEYS.USER_ID);
    }
};
