"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for tracking the state of a media query.
 * @param query The media query string to watch.
 * @returns `true` if the media query matches, `false` otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure this code only runs in the browser
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    
    // Set the initial state
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listener for changes
    const listener = () => {
      setMatches(media.matches);
    };

    // Add event listener
    media.addEventListener('change', listener);

    // Cleanup on unmount
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
