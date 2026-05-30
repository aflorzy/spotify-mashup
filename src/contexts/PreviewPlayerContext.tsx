import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useIframePlayer } from '../hooks/useIframePlayer';
import { useAppStore } from '../store/useAppStore';
import type { IframePlayerProxy } from '../services/spotify/IframePlayerProxy';

interface PreviewPlayerContextValue {
  deviceId: string | null;
  ready: boolean;
  proxy: IframePlayerProxy | null;
}

const PreviewPlayerContext = createContext<PreviewPlayerContextValue>({
  deviceId: null,
  ready: false,
  proxy: null,
});

function PreviewPlayerProviderInner({ children }: { children: ReactNode }) {
  const { deviceId, ready, proxy } = useIframePlayer('A');
  return (
    <PreviewPlayerContext.Provider value={{ deviceId, ready, proxy }}>
      {children}
    </PreviewPlayerContext.Provider>
  );
}

/**
 * Wraps children with a Spotify preview player for Account A.
 * Only renders the inner provider (which calls useIframePlayer) when
 * accountA is present — avoiding unnecessary SDK init when no account
 * is connected.
 */
export function PreviewPlayerProvider({ children }: { children: ReactNode }) {
  const accountA = useAppStore((s) => s.accountA);

  if (!accountA) {
    // No account — provide the default null context without spinning up an iframe
    return (
      <PreviewPlayerContext.Provider value={{ deviceId: null, ready: false, proxy: null }}>
        {children}
      </PreviewPlayerContext.Provider>
    );
  }

  return <PreviewPlayerProviderInner>{children}</PreviewPlayerProviderInner>;
}

export function usePreviewPlayer(): PreviewPlayerContextValue {
  return useContext(PreviewPlayerContext);
}
