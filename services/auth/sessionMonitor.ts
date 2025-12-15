
import { refreshSession } from './refreshSession';

let refreshTimer: any = null;

/**
 * Starts a timer to refresh the session 5 minutes before it expires.
 */
export const startSessionMonitor = (expiresAt: number) => {
    stopSessionMonitor();
    
    // Refresh 5 minutes before expiration
    const refreshTime = expiresAt - (5 * 60 * 1000);
    const delay = refreshTime - Date.now();

    if (delay <= 0) {
        // Already close to expiration or expired, try refresh immediately
        refreshSession().then(newExpiry => {
            if (newExpiry) startSessionMonitor(newExpiry);
        });
    } else {
        refreshTimer = setTimeout(async () => {
            const newExpiry = await refreshSession();
            if (newExpiry) startSessionMonitor(newExpiry);
        }, delay);
    }
};

/**
 * Stops any pending session refresh timer.
 */
export const stopSessionMonitor = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
};
