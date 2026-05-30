import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildAuthUrl, generateCodeVerifier } from '../../services/spotify/auth';
import AccountStatusBadge from '../common/AccountStatusBadge';
import Button from '../common/Button';

interface PlaybackSetupScreenProps {
  onStart: () => void;
  mixName: string;
  trackCount: number;
  readyA: boolean;
  readyB: boolean;
  playerB: Spotify.Player | null;
}

export default function PlaybackSetupScreen({
  onStart,
  mixName,
  trackCount,
  readyA,
  readyB,
  playerB,
}: PlaybackSetupScreenProps) {
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);
  const [playerBActivated, setPlayerBActivated] = useState(false);
  const [starting, setStarting] = useState(false);

  const canStart =
    readyA &&
    readyB &&
    accountA?.deviceId != null &&
    accountB?.deviceId != null;

  async function handleConnectA() {
    const verifier = await generateCodeVerifier();
    sessionStorage.setItem('mashup_return_path', window.location.hash.replace('#', '') || '/');
    const url = await buildAuthUrl('A', verifier);
    window.location.href = url;
  }

  async function handleConnectB() {
    const verifier = await generateCodeVerifier();
    sessionStorage.setItem('mashup_return_path', window.location.hash.replace('#', '') || '/');
    const url = await buildAuthUrl('B', verifier);
    window.location.href = url;
  }

  function handleActivatePlayerB() {
    if (playerB) {
      playerB.activateElement();
    }
    setPlayerBActivated(true);
  }

  async function handleStart() {
    setStarting(true);
    try {
      await onStart();
    } finally {
      setStarting(false);
    }
  }

  function getNotReadyMessage(): string | null {
    if (!accountA?.deviceId || !readyA) return 'Player A is still connecting…';
    if (!accountB?.deviceId || !readyB) return 'Player B is still connecting…';
    return null;
  }

  const notReadyMsg = getNotReadyMessage();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        {/* Mix info */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">{mixName}</h1>
          <p className="mt-1 text-gray-400">{trackCount} track{trackCount !== 1 ? 's' : ''}</p>
        </div>

        {/* Player A */}
        <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Player A</span>
            <AccountStatusBadge account={accountA} label="Account A" />
          </div>
          {!accountA && (
            <Button variant="secondary" size="lg" className="w-full" onClick={handleConnectA}>
              Connect Player A
            </Button>
          )}
        </div>

        {/* Player B */}
        <div className="bg-gray-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Player B</span>
            <AccountStatusBadge account={accountB} label="Account B" />
          </div>
          {!accountB && (
            <Button variant="secondary" size="lg" className="w-full" onClick={handleConnectB}>
              Connect Player B
            </Button>
          )}

          {/* iOS warm-up tap */}
          <div className="flex flex-col gap-2 pt-1 border-t border-gray-800">
            <button
              onClick={handleActivatePlayerB}
              className={`
                w-full min-h-[56px] rounded-xl text-base font-semibold transition-colors
                ${playerBActivated
                  ? 'bg-green-900 text-green-400 border border-green-700'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 active:scale-95'}
              `}
            >
              {playerBActivated ? '✓ Player B Activated' : 'Tap to Activate Player B'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              Required on iPhone/iPad. Tap once before starting.
            </p>
          </div>
        </div>

        {/* Start Mix */}
        <div className="flex flex-col gap-3">
          {notReadyMsg && (
            <p className="text-center text-sm text-yellow-400">{notReadyMsg}</p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-[56px] text-lg"
            disabled={!canStart || starting}
            onClick={handleStart}
          >
            {starting ? 'Starting…' : 'Start Mix'}
          </Button>
        </div>
      </div>
    </div>
  );
}
