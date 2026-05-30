import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAudioAnalysis } from '../services/spotify/api';
import { getValidToken } from '../services/spotify/auth';
import { getCachedWaveform, setCachedWaveform } from '../services/storage/waveformCache';
import { normalizeWaveform } from '../utils/normalize';

export function useWaveform(trackId: string | null) {
  const accountA = useAppStore((s) => s.accountA);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId || !accountA) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const cached = await getCachedWaveform(trackId);
        if (cached) {
          if (!cancelled) setWaveform(cached);
          return;
        }
        const token = await getValidToken(accountA);
        const analysis = await getAudioAnalysis(trackId, token);
        const normalized = normalizeWaveform(analysis.segments);
        await setCachedWaveform(trackId, normalized);
        if (!cancelled) setWaveform(normalized);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load waveform');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trackId, accountA]);

  return { waveform, loading, error };
}
