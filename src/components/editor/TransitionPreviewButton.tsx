import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { startPlayback, pausePlayback } from '../../services/spotify/api';
import { getValidToken } from '../../services/spotify/auth';
import { waitForDevice, waitForDeviceVisible } from '../../services/spotify/playerUtils';
import { usePreviewPlayer } from '../../contexts/PreviewPlayerContext';

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
  const { deviceId, ready, proxy } = usePreviewPlayer();

  const [playing, setPlaying] = useState(false);
  const [apiConnecting, setApiConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-stop timer on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    };
  }, []);

  const seekMs = Math.max(0, endMs - crossfadeOutMs - 2000);

  const handleClick = useCallback(async () => {
    if (!accountA || !proxy) return;

    setError(null);

    if (playing) {
      // Pause and clear auto-stop timer
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      try {
        const token = await getValidToken(accountA);
        const liveDeviceId = await waitForDevice(proxy);
        await pausePlayback(liveDeviceId, token);
      } catch {
        // best-effort stop
      }
      setPlaying(false);
      return;
    }

    try {
      const token = await getValidToken(accountA);
      const liveDeviceId = await waitForDevice(proxy);
      setApiConnecting(true);
      await waitForDeviceVisible(liveDeviceId, token);
      setApiConnecting(false);
      await startPlayback(liveDeviceId, [spotifyUri], seekMs, token);
      setPlaying(true);

      // Auto-stop the playing indicator after the crossfade window + 4s buffer
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = setTimeout(() => {
        setPlaying(false);
      }, crossfadeOutMs + 4000);
    } catch (e) {
      setApiConnecting(false);
      setError(e instanceof Error ? e.message : 'Playback failed');
    }
  }, [accountA, proxy, spotifyUri, seekMs, playing, crossfadeOutMs]);

  // --- Render states ---

  if (!accountA) {
    return (
      <div className="flex flex-col gap-1">
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-800 text-gray-500 cursor-not-allowed"
          title="Connect Spotify to preview transitions"
        >
          <span>▶</span>
          <span>Connect Spotify to preview</span>
        </button>
      </div>
    );
  }

  if (!ready || !deviceId || !proxy) {
    return (
      <div className="flex flex-col gap-1">
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-800 text-gray-500 cursor-not-allowed"
          title="Waiting for Spotify player to connect"
        >
          <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-500 border-t-green-400 animate-spin" />
          <span>Player connecting…</span>
        </button>
      </div>
    );
  }

  if (apiConnecting) {
    return (
      <div className="flex flex-col gap-1">
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-gray-800 text-gray-500 cursor-not-allowed"
        >
          <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-500 border-t-green-400 animate-spin" />
          <span>Connecting player…</span>
        </button>
      </div>
    );
  }

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
