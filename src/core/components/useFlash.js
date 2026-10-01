import { useEffect, useRef, useState } from 'react';

// True for a moment after `sig` changes (not on first render). Drives the change highlight.
export function useFlash(sig) {
  const first = useRef(true);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    setOn(true);
    const t = setTimeout(() => setOn(false), 1400);
    return () => clearTimeout(t);
  }, [sig]);
  return on;
}
