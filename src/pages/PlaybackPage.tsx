import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMixStore } from '../store/useMixStore';
import { useAppStore } from '../store/useAppStore';
import { getMix } from '../services/storage/db';
import { useIframePlayer } from '../hooks/useIframePlayer';
import { CrossfadeEngine } from '../engine/CrossfadeEngine';
import type { EngineState } from '../types/engine';
import PlaybackSetupScreen from '../components/playback/PlaybackSetupScreen';
import DJView from '../components/playback/DJView';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

export default function PlaybackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { currentMix, setMix } = useMixStore();
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);

  const { proxy: proxyA, ready: readyA } = useIframePlayer('A');
  const { proxy: proxyB, ready: readyB } = useIframePlayer('B');

  const engineRef = useRef<CrossfadeEngine | null>(null);

  const [engineState, setEngineState] = useState<EngineState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [fadeProgress, setFadeProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mix from DB if not already in store
  useEffect(() => {
    if (!id) {
      setError('No mix ID provided.');
      setLoading(false);
      return;
    }

    if (currentMix?.id === id) {
      setLoading(false);
      return;
    }

    getMix(id).then((mix) => {
      if (!mix) {
        setError(`Mix not found (ID: ${id})`);
      } else {
        setMix(mix);
      }
      setLoading(false);
    }).catch(() => {
      setError('Failed to load mix.');
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  async function handleStart() {
    if (!proxyA || !proxyB || !accountA || !accountB || !currentMix) return;

    const engine = new CrossfadeEngine(proxyA, proxyB, accountA, accountB, {
      onStateChange: (state) => setEngineState(state),
      onTrackChange: (index) => setCurrentIndex(index),
      onPosition: (pos) => setPosition(pos),
      onFadeProgress: (p) => setFadeProgress(p),
      onError: (msg) => setError(msg),
      onComplete: () => {
        setStarted(false);
        setEngineState('stopped');
      },
    });

    engineRef.current = engine;
    await engine.start(currentMix.tracks);
    setStarted(true);
  }

  function handleSkip() {
    engineRef.current?.skipToNextFade();
  }

  function handleStop() {
    engineRef.current?.stop();
    setStarted(false);
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full text-center flex flex-col gap-4">
          <p className="text-red-400 font-medium">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/mixes')}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  // Mix complete
  if (engineState === 'stopped' && started === false && currentMix) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-white">Mix Complete</h1>
          <p className="text-gray-400">{currentMix.name} has finished.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => navigate('/mixes')}>
          Back to mixes
        </Button>
      </div>
    );
  }

  if (!currentMix) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentTrack = currentMix.tracks[currentIndex] ?? null;
  const nextTrack = currentMix.tracks[currentIndex + 1] ?? null;

  // Setup screen — before mix starts or after stop
  if (!started || engineState === 'idle') {
    return (
      <PlaybackSetupScreen
        onStart={handleStart}
        mixName={currentMix.name}
        trackCount={currentMix.tracks.length}
        readyA={readyA}
        readyB={readyB}
        onActivatePlayerB={() => proxyB?.activate()}
      />
    );
  }

  // Active playback
  return (
    <DJView
      currentTrack={currentTrack}
      nextTrack={nextTrack}
      engineState={engineState}
      position={position}
      fadeProgress={fadeProgress}
      currentTrack_endMs={currentTrack?.endMs ?? 0}
      currentTrack_crossfadeOutMs={currentTrack?.crossfadeOutMs ?? 4000}
      onSkip={handleSkip}
      onStop={handleStop}
    />
  );
}
