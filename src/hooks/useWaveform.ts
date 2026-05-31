import { useMemo } from 'react';

function generateProceduralWaveform(trackId: string, numBars = 200): number[] {
  let seed = 0;
  for (let i = 0; i < trackId.length; i++) {
    seed = (seed * 31 + trackId.charCodeAt(i)) & 0x7fffffff;
  }
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  return Array.from({ length: numBars }, (_, i) => {
    const pos = i / numBars;
    const envelope = Math.sin(pos * Math.PI) * 0.5 + 0.25;
    return Math.min(1, Math.max(0.05, envelope + (lcg() - 0.5) * 0.35));
  });
}

export function useWaveform(trackId: string | null) {
  const waveform = useMemo(
    () => (trackId ? generateProceduralWaveform(trackId) : []),
    [trackId]
  );
  return { waveform, loading: false, error: null };
}
