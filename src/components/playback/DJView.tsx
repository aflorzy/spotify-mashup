import type { EngineState } from '../../types/engine';
import type { MixTrack } from '../../types/mix';
import NowPlayingCard from './NowPlayingCard';
import NextUpCard from './NextUpCard';
import CrossfadeCountdown from './CrossfadeCountdown';
import Button from '../common/Button';

interface DJViewProps {
  currentTrack: MixTrack | null;
  nextTrack: MixTrack | null;
  engineState: EngineState;
  position: number;
  fadeProgress: number;
  currentTrack_endMs: number;
  currentTrack_crossfadeOutMs: number;
  onSkip: () => void;
  onStop: () => void;
}

export default function DJView({
  currentTrack,
  nextTrack,
  engineState,
  position,
  fadeProgress,
  currentTrack_endMs,
  currentTrack_crossfadeOutMs,
  onSkip,
  onStop,
}: DJViewProps) {
  const startMs = currentTrack?.startMs ?? 0;
  const endMs = currentTrack?.endMs ?? 1;
  const progress = Math.min(1, Math.max(0, (position - startMs) / (endMs - startMs)));

  const timeUntilFadeMs = Math.max(
    0,
    currentTrack_endMs - currentTrack_crossfadeOutMs - position,
  );

  function handleStop() {
    if (window.confirm('Stop the mix? This will pause all playback.')) {
      onStop();
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8 gap-6">
      {/* Now Playing */}
      <NowPlayingCard track={currentTrack} />

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Crossfade status */}
      <CrossfadeCountdown
        engineState={engineState}
        fadeProgress={fadeProgress}
        currentTrack={currentTrack}
        timeUntilFadeMs={timeUntilFadeMs}
      />

      {/* Up Next */}
      <NextUpCard track={nextTrack} />

      {/* Controls */}
      <div className="flex gap-3 mt-4 w-full max-w-sm">
        <Button
          variant="ghost"
          size="lg"
          className="flex-1 min-h-[52px] border border-gray-700"
          onClick={onSkip}
        >
          Skip to next fade →
        </Button>
        <Button
          variant="danger"
          size="lg"
          className="min-h-[52px] px-5"
          onClick={handleStop}
        >
          Stop
        </Button>
      </div>
    </div>
  );
}
