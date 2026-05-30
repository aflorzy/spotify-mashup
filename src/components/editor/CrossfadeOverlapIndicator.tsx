interface CrossfadeOverlapIndicatorProps {
  crossfadeOutMs: number;
  crossfadeInMs: number;
  prevTrackEndMs: number;
  prevTrackStartMs: number;
  nextTrackStartMs: number;
  nextTrackEndMs: number;
}

export default function CrossfadeOverlapIndicator({
  crossfadeOutMs,
  crossfadeInMs,
  prevTrackEndMs,
  prevTrackStartMs,
  nextTrackStartMs,
  nextTrackEndMs,
}: CrossfadeOverlapIndicatorProps) {
  const overlapMs = Math.max(crossfadeOutMs, crossfadeInMs);

  // Check if fade regions fit within trim boundaries
  const prevTrimDuration = prevTrackEndMs - prevTrackStartMs;
  const nextTrimDuration = nextTrackEndMs - nextTrackStartMs;
  const fadeOutFits = crossfadeOutMs <= prevTrimDuration;
  const fadeInFits = crossfadeInMs <= nextTrimDuration;
  const isValid = fadeOutFits && fadeInFits;

  const overlapSec = (overlapMs / 1000).toFixed(1).replace(/\.0$/, '');

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          isValid
            ? 'bg-green-900/40 text-green-400 border border-green-700/50'
            : 'bg-red-900/40 text-red-400 border border-red-700/50'
        }`}
      >
        {/* Overlap bar */}
        <div className="flex items-center gap-1">
          <div
            className={`h-1.5 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: Math.max(16, Math.min(64, overlapMs / 250)) }}
          />
        </div>
        <span>{overlapSec}s crossfade</span>
        {!isValid && (
          <span className="text-red-400 ml-1" title="Fade region extends past trim boundary">
            ⚠
          </span>
        )}
      </div>
    </div>
  );
}
