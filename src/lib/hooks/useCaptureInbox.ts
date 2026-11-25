import { useCallback, useEffect, useState } from "react";
import { getInboxCount } from "@/lib/api/captures";

const CHANGED = "captureiq:changed";

/** Call after anything that changes the inbox (a new capture, a confirm, a reject) so the badge updates at once. */
export function notifyInboxChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

/** Number of captures waiting for review, for the navigation badge. Polls once a minute and on changes. */
export function useInboxCount(enabled: boolean): number {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    try {
      setCount(await getInboxCount());
    } catch {
      /* the badge is a convenience: stay silent */
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    void load();
    const t = setInterval(load, 60_000);
    window.addEventListener(CHANGED, load);
    return () => {
      clearInterval(t);
      window.removeEventListener(CHANGED, load);
    };
  }, [enabled, load]);
  return enabled ? count : 0;
}
