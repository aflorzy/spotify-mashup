import { useEffect } from 'react';
import Router from './router';
import { loadAccount, clearAccount, REQUIRED_SCOPES_VERSION } from './services/spotify/auth';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { setAccountA, setAccountB, setAuthError } = useAppStore();

  useEffect(() => {
    let needsReauth = false;

    const savedA = loadAccount('A');
    if (savedA) {
      if ((savedA.scopesVersion ?? 0) < REQUIRED_SCOPES_VERSION) {
        clearAccount('A');
        needsReauth = true;
      } else {
        setAccountA(savedA);
      }
    }

    const savedB = loadAccount('B');
    if (savedB) {
      if ((savedB.scopesVersion ?? 0) < REQUIRED_SCOPES_VERSION) {
        clearAccount('B');
        needsReauth = true;
      } else {
        setAccountB(savedB);
      }
    }

    if (needsReauth) {
      setAuthError(
        'Your Spotify connection needs to be updated — please reconnect to enable playlist access.'
      );
    }
  }, [setAccountA, setAccountB, setAuthError]);

  return <Router />;
}
