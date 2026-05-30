import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAudioFeatures } from '../services/spotify/api';
import { getValidToken } from '../services/spotify/auth';
import type { SpotifyAudioFeatures } from '../types/spotify';

export function useAudioFeatures(trackId: string | null) {
  const accountA = useAppStore((s) => s.accountA);
  const [features, setFeatures] = useState<SpotifyAudioFeatures | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId || !accountA) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getValidToken(accountA)
      .then((token) => getAudioFeatures(trackId, token))
      .then((f) => { if (!cancelled) setFeatures(f); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [trackId, accountA]);

  return { features, loading, error };
}
