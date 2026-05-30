import { useEffect } from 'react';
import Router from './router';
import { loadAccount } from './services/spotify/auth';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { setAccountA, setAccountB } = useAppStore();

  useEffect(() => {
    const savedA = loadAccount('A');
    if (savedA) setAccountA(savedA);
    const savedB = loadAccount('B');
    if (savedB) setAccountB(savedB);
  }, [setAccountA, setAccountB]);

  return <Router />;
}
