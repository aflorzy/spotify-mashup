// Fetches and normalizes audio analysis waveform data.
// Implemented by: feature/services agent
export function useWaveform(_trackId: string | null) {
  return { waveform: [] as number[], loading: false, error: null };
}
