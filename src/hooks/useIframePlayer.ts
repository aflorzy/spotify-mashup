import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getValidToken } from '../services/spotify/auth';
import { IframePlayerProxy } from '../services/spotify/IframePlayerProxy';
import type { PlayerAccount } from '../types/mix';

export function useIframePlayer(role: 'A' | 'B') {
  const account = useAppStore((s) => (role === 'A' ? s.accountA : s.accountB));
  const setAccountA = useAppStore((s) => s.setAccountA);
  const setAccountB = useAppStore((s) => s.setAccountB);

  const proxyRef = useRef<IframePlayerProxy | null>(null);
  const initedRef = useRef(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Create proxy once per role; it owns the iframe for its lifetime
  useEffect(() => {
    initedRef.current = false;

    const getToken = (): Promise<string> => {
      const acct = useAppStore.getState()[role === 'A' ? 'accountA' : 'accountB'];
      return acct ? getValidToken(acct) : Promise.resolve('');
    };

    const proxy = new IframePlayerProxy(getToken);
    proxyRef.current = proxy;

    proxy.addListener('ready', ({ deviceId: did }: { deviceId: string }) => {
      setDeviceId(did);
      setReady(true);
      const acct = useAppStore.getState()[role === 'A' ? 'accountA' : 'accountB'];
      if (acct) {
        const updated: PlayerAccount = { ...acct, deviceId: did };
        if (role === 'A') setAccountA(updated);
        else setAccountB(updated);
      }
    });

    proxy.addListener('not_ready', () => {
      setDeviceId(null);
      setReady(false);
    });

    return () => {
      proxy.destroy();
      proxyRef.current = null;
      setDeviceId(null);
      setReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Send init once when the account becomes available for the first time
  useEffect(() => {
    if (!account || initedRef.current || !proxyRef.current) return;
    initedRef.current = true;
    getValidToken(account)
      .then((token) => proxyRef.current?.init(`MashUp Player ${role}`, token))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!account]);

  // Keep the iframe's token fresh whenever the stored token rotates
  useEffect(() => {
    if (!account?.accessToken || !proxyRef.current) return;
    proxyRef.current.setToken(account.accessToken);
  }, [account?.accessToken]);

  return { proxy: proxyRef.current, deviceId, ready };
}
