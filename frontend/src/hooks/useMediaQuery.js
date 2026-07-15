import { useState, useEffect } from "react";

// Generic hook: pass a CSS media query string, get back a boolean.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    // addEventListener supported in all modern browsers incl. Safari 14+
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Convenience breakpoints used across InvenIQ. Keep in sync with index.css breakpoints.
export function useBreakpoints() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  return { isMobile, isTablet };
}