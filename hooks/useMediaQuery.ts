
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    // Deprecated 'addListener' is used for broader browser support.
    try {
        media.addEventListener('change', listener);
    } catch (e) {
        media.addListener(listener);
    }

    return () => {
        try {
            media.removeEventListener('change', listener);
        } catch (e) {
            media.removeListener(listener);
        }
    };
  }, [matches, query]);

  return matches;
}
