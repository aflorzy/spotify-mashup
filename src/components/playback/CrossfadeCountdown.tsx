import type { EngineState } from '../../types/engine';
import type { MixTrack } from '../../types/mix';

interface Props {
  engineState: EngineState;
  fadeProgress: number;
  currentTrack: MixTrack | null;
  timeUntilFadeMs: number;
}

export default function CrossfadeCountdown({
  engineState,
  fadeProgress,
  currentTrack: _currentTrack,
  timeUntilFadeMs,
}: Props) {
  if (engineState === 'stopped' || engineState === 'idle') {
    return null;
  }

  if (engineState === 'paused') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm text-gray-500">Paused</span>
      </div>
    );
  }

  if (engineState === 'fading') {
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        <span className="text-sm font-medium text-green-400 animate-pulse">Fading now…</span>
        <div className="w-full bg-gray-800 rounded h-1 overflow-hidden">
          <div
            className="bg-green-500 h-1 rounded transition-all duration-75"
            style={{ width: `${Math.min(1, Math.max(0, fadeProgress)) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // engineState === 'playing'
  if (timeUntilFadeMs > 0) {
    const secs = Math.ceil(timeUntilFadeMs / 1000);
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm text-green-400">
          Fading in {secs}s
        </span>
      </div>
    );
  }

  return null;
}
