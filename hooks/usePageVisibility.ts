
import { useEffect } from 'react';

/**
 * Hook that triggers a callback when the page becomes visible (tab focus).
 * Now includes a check to ensure user data is loaded before firing.
 */
export const usePageVisibility = (onVisible: () => void, isUserLoaded: boolean) => {
    useEffect(() => {
        const handleVisibilityChange = () => {
            // CRITICAL FIX: Only trigger the visibility check if the user is loaded.
            // This prevents a race condition during hot-reloads or layout shifts
            // where the session is checked before user state is restored, causing a false logout.
            if (document.visibilityState === 'visible' && isUserLoaded) {
                onVisible();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange); // Fallback for some window managers

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [onVisible, isUserLoaded]);
};
