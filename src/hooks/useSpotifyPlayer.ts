import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { createPlayer } from '../services/spotify/sdk';
import { getValidToken } from '../services/spotify/auth';
import type { PlayerAccount } from '../types/mix';

export function useSpotifyPlayer(role: 'A' | 'B') {
  const account = useAppStore((s) => role === 'A' ? s.accountA : s.accountB);
  const setAccountA = useAppStore((s) => s.setAccountA);
  const setAccountB = useAppStore((s) => s.setAccountB);
  const sdkReady = useAppStore((s) => s.sdkReady);

  const playerRef = useRef<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!account || !sdkReady) return;

    const player = createPlayer(
      `MashUp Player ${role}`,
      (cb) => {
        getValidToken(account).then(cb).catch(() => cb(account.accessToken));
      },
      1,
    );
    playerRef.current = player;

    player.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id);
      setReady(true);
      const updated: PlayerAccount = { ...account, deviceId: device_id };
      if (role === 'A') setAccountA(updated);
      else setAccountB(updated);
    });

    player.addListener('not_ready', () => {
      setDeviceId(null);
      setReady(false);
    });

    player.connect();

    return () => {
      player.disconnect();
      playerRef.current = null;
      setDeviceId(null);
      setReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, sdkReady, !!account]);

  return { player: playerRef.current, deviceId, ready };
}
