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
    initSdk(() => setSdkReady(true));
  }, [setSdkReady, setAccountA, setAccountB]);

  return <Router />;
}
