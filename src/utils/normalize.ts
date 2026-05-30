import type { SpotifyAudioAnalysisSegment } from '../types/spotify';

export function normalizeWaveform(segments: SpotifyAudioAnalysisSegment[], targetPoints = 200): number[] {
  if (segments.length === 0) return new Array(targetPoints).fill(0.5);

  const normalized = segments.map((s) => {
    const val = (s.loudness_max + 60) / 60;
    return Math.max(0, Math.min(1, val));
  });

  if (normalized.length <= targetPoints) {
    return normalized;
  }

  const step = normalized.length / targetPoints;
  const result: number[] = [];
  for (let i = 0; i < targetPoints; i++) {
    const idx = Math.floor(i * step);
    result.push(normalized[idx]);
  }
  return result;
}
