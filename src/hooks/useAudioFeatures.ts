import type { SpotifyAudioFeatures } from '../types/spotify';

export function useAudioFeatures(_trackId: string | null) {
  return { features: null as SpotifyAudioFeatures | null, loading: false, error: null };
}
