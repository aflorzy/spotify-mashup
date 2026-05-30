import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getValidToken } from '../services/spotify/auth';

export function useTokenRefresh() {
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (accountA) await getValidToken(accountA).catch(() => {});
      if (accountB) await getValidToken(accountB).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [accountA, accountB]);
}
