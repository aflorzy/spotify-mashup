import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildAuthUrl, generateCodeVerifier, saveAccount } from '../../services/spotify/auth';
import type { PlayerAccount } from '../../types/mix';
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
  const setAccountB = useAppStore((s) => s.setAccountB);
  const popupRef = useRef<Window | null>(null);
  const [playerBActivated, setPlayerBActivated] = useState(false);
  const [starting, setStarting] = useState(false);

  const canStart =
    readyA &&
    readyB &&
    accountA?.deviceId != null &&
    accountB?.deviceId != null;

  async function handleConnectA() {
    const verifier = await generateCodeVerifier();
    sessionStorage.setItem('mashup_auth_return', window.location.pathname || '/');
    const url = await buildAuthUrl('A', verifier);
    window.location.href = url;
  }

  async function handleConnectB() {
    const verifier = await generateCodeVerifier();
    const url = await buildAuthUrl('B', verifier, true);

    const popup = window.open(url, 'spotify_auth_B', 'width=500,height=750,left=200,top=100');
    if (!popup) {
      // Popup blocked — fall back to full redirect
      sessionStorage.setItem('mashup_auth_return', window.location.pathname || '/');
      window.location.href = url;
      return;
    }
    popupRef.current = popup;
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'mashup_auth_complete') return;
      const account = event.data.account as PlayerAccount;
      setAccountB(account);
      saveAccount(account);
      popupRef.current?.close();
      popupRef.current = null;
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setAccountB]);

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
