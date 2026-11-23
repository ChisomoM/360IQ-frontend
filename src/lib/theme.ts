import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'paper' | 'ink';

const listeners = new Set<() => void>();

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('360iq-theme', t); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

export function initTheme() {
  let t: Theme = 'paper';
  try { t = (localStorage.getItem('360iq-theme') as Theme) || 'paper'; } catch { /* storage unavailable */ }
  setTheme(t);
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'ink' ? 'ink' : 'paper';
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'paper' as Theme);
  const set = useCallback((t: Theme) => setTheme(t), []);
  return [theme, set];
}
