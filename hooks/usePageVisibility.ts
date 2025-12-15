
import { useEffect } from 'react';

/**
 * Hook that triggers a callback when the page becomes visible (tab focus).
 */
export const usePageVisibility = (onVisible: () => void) => {
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                onVisible();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange); // Fallback for some window managers

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [onVisible]);
};
