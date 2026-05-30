import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { startPlayback, pausePlayback } from '../../services/spotify/api';
import { getValidToken } from '../../services/spotify/auth';

interface TransitionPreviewButtonProps {
  trackId: string;
  spotifyUri: string;
  nextTrackId: string | null;
  startMs: number;
  endMs: number;
  crossfadeOutMs: number;
}

export default function TransitionPreviewButton({
  spotifyUri,
  nextTrackId: _nextTrackId,
  startMs: _startMs,
  endMs,
  crossfadeOutMs,
}: TransitionPreviewButtonProps) {
  const accountA = useAppStore((s) => s.accountA);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seekMs = Math.max(0, endMs - crossfadeOutMs - 2000);

  const handleClick = useCallback(async () => {
    if (!accountA?.deviceId) {
      setError('No active player');
      return;
    }

    setError(null);

    if (playing) {
      try {
        const token = await getValidToken(accountA);
        await pausePlayback(accountA.deviceId, token);
      } catch {
        // best-effort stop
      }
      setPlaying(false);
      return;
    }

    try {
      const token = await getValidToken(accountA);
      await startPlayback(accountA.deviceId, [spotifyUri], seekMs, token);
      setPlaying(true);

      // Auto-stop indicator after ~8s (crossfade preview window)
      setTimeout(() => setPlaying(false), 8000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed');
    }
  }, [accountA, spotifyUri, seekMs, playing]);

  if (!accountA) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          playing
            ? 'bg-orange-600 hover:bg-orange-500 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        }`}
        title={`Preview transition from ${Math.round(seekMs / 1000)}s`}
      >
        <span>{playing ? '■' : '▶'}</span>
        <span>{playing ? 'Stop preview' : 'Preview transition'}</span>
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
