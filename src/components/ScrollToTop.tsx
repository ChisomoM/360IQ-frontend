import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // inside the app shell the page scrolls in <main id="main">, not in the window
    document.getElementById('main')?.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
