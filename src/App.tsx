import { useEffect } from 'react';
import Router from './router';
import { initSdk } from './services/spotify/sdk';
import { loadAccount } from './services/spotify/auth';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { setSdkReady, setAccountA, setAccountB } = useAppStore();

  useEffect(() => {
    // Restore saved accounts from sessionStorage
    const savedA = loadAccount('A');
    if (savedA) setAccountA(savedA);
    const savedB = loadAccount('B');
    if (savedB) setAccountB(savedB);

    // Init Spotify SDK
    // Guard: if the SDK script was already loaded (e.g., from cache), the callback
    // would have fired before this effect ran. Check window.Spotify directly.
    if (window.Spotify) {
      setSdkReady(true);
    } else {
      initSdk(() => setSdkReady(true));
    }
  }, [setSdkReady, setAccountA, setAccountB]);

  return <Router />;
}
