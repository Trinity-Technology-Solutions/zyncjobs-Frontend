import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { setPreviousPath } from '../utils/navigationHistory';

// Rendered once inside <BrowserRouter>. On every route change it records the
// previous in-app path (including query string) so BackButton can return to it.
const NavigationTracker: React.FC = () => {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const current = location.pathname + location.search;
    if (prevPath.current !== null && prevPath.current !== current) {
      setPreviousPath(prevPath.current);
    }
    prevPath.current = current;
  }, [location.pathname, location.search]);

  return null;
};

export default NavigationTracker;
