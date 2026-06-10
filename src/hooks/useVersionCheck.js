import { useEffect, useState } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // In dev, Vite's HMR handles updates — skip polling
    if (import.meta.env.DEV) return;

    let initialVersion = null;

    const check = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const { v } = await res.json();
        if (initialVersion === null) {
          initialVersion = v;
        } else if (v !== initialVersion) {
          setHasUpdate(true);
        }
      } catch {
        // network error — ignore, retry on next interval
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return hasUpdate;
}
