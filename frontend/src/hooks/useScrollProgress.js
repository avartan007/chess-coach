import { useState, useEffect, useCallback } from 'react';

/**
 * Returns normalized scroll progress (0-1) across the full page height.
 * Also returns individual section progress values.
 */
export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const sy = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const prog = total > 0 ? Math.min(1, Math.max(0, sy / total)) : 0;
    setScrollY(sy);
    setScrollProgress(prog);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { scrollProgress, scrollY };
}
