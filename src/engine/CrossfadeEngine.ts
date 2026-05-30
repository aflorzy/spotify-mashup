import type { MixTrack, PlayerAccount } from '../types/mix';
import type { EngineState } from '../types/engine';
import { startPlayback } from '../services/spotify/api';
import { getValidToken } from '../services/spotify/auth';
import { easeInOutCubic } from './easing';

export interface EngineCallbacks {
  onStateChange: (state: EngineState) => void;
  onTrackChange: (index: number) => void;
  onPosition: (positionMs: number) => void;
  onFadeProgress: (progress: number) => void;
  onError: (message: string) => void;
  onComplete: () => void;
}

export class CrossfadeEngine {
  private playerA: Spotify.Player;
  private playerB: Spotify.Player;
  private accountA: PlayerAccount;
  private accountB: PlayerAccount;

  private activePlayer: 'A' | 'B' = 'A';
  private tracks: MixTrack[] = [];
  private currentIndex = 0;

  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private state: EngineState = 'idle';
  private callbacks: EngineCallbacks;

  // Prevent re-entrant crossfade triggers
  private fadingGuard = false;

  constructor(
    playerA: Spotify.Player,
    playerB: Spotify.Player,
    accountA: PlayerAccount,
    accountB: PlayerAccount,
    callbacks: EngineCallbacks,
  ) {
    this.playerA = playerA;
    this.playerB = playerB;
    this.accountA = accountA;
    this.accountB = accountB;
    this.callbacks = callbacks;
    this.bindListeners();
  }

  private bindListeners(): void {
    const handleState = (playerRole: 'A' | 'B') => async (playbackState: Spotify.PlaybackState | null) => {
      if (!playbackState || this.state !== 'playing') return;
      if (playerRole !== this.activePlayer) return;

      const position = playbackState.position;
      this.callbacks.onPosition(position);

      const track = this.tracks[this.currentIndex];
      if (!track) return;

      const fadeStartAt = track.endMs - track.crossfadeOutMs;

      // Pause before track ends naturally to avoid SDK seek-disallow bug
      const hardStopAt = track.endMs - 500;
      if (position >= hardStopAt && !this.fadingGuard) {
        await this.beginCrossfade();
        return;
      }

      if (position >= fadeStartAt && !this.fadingGuard) {
        await this.beginCrossfade();
      }
    };

    this.playerA.addListener('player_state_changed', handleState('A'));
    this.playerB.addListener('player_state_changed', handleState('B'));
  }

  async start(tracks: MixTrack[]): Promise<void> {
    if (tracks.length === 0) {
      this.callbacks.onError('No tracks in mix');
      return;
    }
    this.tracks = tracks;
    this.currentIndex = 0;
    this.activePlayer = 'A';
    this.fadingGuard = false;

    try {
      // Load track 0 onto Player A, start playing from startMs
      const track0 = tracks[0];
      const tokenA = await getValidToken(this.accountA);
      await startPlayback(this.accountA.deviceId!, [track0.spotifyUri], track0.startMs, tokenA);
      await this.playerA.setVolume(1);
      await this.playerB.setVolume(0);

      // Stage track 1 onto Player B (load+seek, stay paused and silent)
      if (tracks.length > 1) {
        await this.stageTrack(tracks[1], 'B');
      }

      this.setState('playing');
      this.callbacks.onTrackChange(0);
      this.startScheduler();
    } catch (e) {
      this.callbacks.onError(e instanceof Error ? e.message : 'Failed to start playback');
    }
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.setState('paused');
    this.stopScheduler();
    const activeP = this.activePlayer === 'A' ? this.playerA : this.playerB;
    activeP.pause().catch(() => {});
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.setState('playing');
    const activeP = this.activePlayer === 'A' ? this.playerA : this.playerB;
    activeP.resume().catch(() => {});
    this.startScheduler();
  }

  stop(): void {
    this.stopScheduler();
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.playerA.pause().catch(() => {});
    this.playerB.pause().catch(() => {});
    this.playerA.setVolume(0).catch(() => {});
    this.playerB.setVolume(0).catch(() => {});
    this.setState('stopped');
  }

  skipToNextFade(): void {
    if (this.state !== 'playing' || this.fadingGuard) return;
    this.beginCrossfade().catch((e) => {
      this.callbacks.onError(e instanceof Error ? e.message : 'Skip failed');
    });
  }

  private async beginCrossfade(): Promise<void> {
    if (this.fadingGuard) return;
    this.fadingGuard = true;

    // If we're on the last track, just stop
    if (this.currentIndex >= this.tracks.length - 1) {
      this.stop();
      this.callbacks.onComplete();
      return;
    }

    this.setState('fading');
    this.stopScheduler();

    const activeTrack = this.tracks[this.currentIndex];
    const fadeDuration = activeTrack.crossfadeOutMs;
    const activeP = this.activePlayer === 'A' ? this.playerA : this.playerB;
    const stagedP = this.activePlayer === 'A' ? this.playerB : this.playerA;

    try {
      // Resume the staged (pre-loaded, paused) player
      const stagedRole = this.activePlayer === 'A' ? 'B' : 'A';
      const stagedAccount = stagedRole === 'A' ? this.accountA : this.accountB;
      const stagedToken = await getValidToken(stagedAccount);
      const nextTrack = this.tracks[this.currentIndex + 1];
      await startPlayback(stagedAccount.deviceId!, [nextTrack.spotifyUri], nextTrack.startMs, stagedToken);

      // Volume ramp: active → 0, staged → 1 over fadeDuration
      let elapsed = 0;
      const TICK = 50;

      this.fadeInterval = setInterval(async () => {
        elapsed += TICK;
        const t = Math.min(elapsed / fadeDuration, 1);
        const eased = easeInOutCubic(t);
        await activeP.setVolume(Math.max(0, 1 - eased));
        await stagedP.setVolume(Math.min(1, eased));
        this.callbacks.onFadeProgress(t);

        if (elapsed >= fadeDuration) {
          clearInterval(this.fadeInterval!);
          this.fadeInterval = null;
          await this.completeCrossfade(activeP);
        }
      }, TICK);
    } catch (e) {
      this.fadingGuard = false;
      this.callbacks.onError(e instanceof Error ? e.message : 'Crossfade failed');
      this.setState('playing');
      this.startScheduler();
    }
  }

  private async completeCrossfade(oldActivePlayer: Spotify.Player): Promise<void> {
    // Pause and mute old active player
    await oldActivePlayer.pause().catch(() => {});
    await oldActivePlayer.setVolume(0).catch(() => {});

    // Swap roles
    this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';
    this.currentIndex++;
    this.callbacks.onTrackChange(this.currentIndex);

    // Stage next track on the now-idle player, if available
    if (this.currentIndex + 1 < this.tracks.length) {
      const nextNextTrack = this.tracks[this.currentIndex + 1];
      const idlePlayer = this.activePlayer === 'A' ? 'B' : 'A';
      await this.stageTrack(nextNextTrack, idlePlayer).catch((e) => {
        // Non-fatal: next staging can be retried
        console.warn('Failed to stage next track:', e);
      });
    }

    this.fadingGuard = false;
    this.setState('playing');
    this.startScheduler();
  }

  private async stageTrack(track: MixTrack, playerRole: 'A' | 'B'): Promise<void> {
    const account = playerRole === 'A' ? this.accountA : this.accountB;
    const player = playerRole === 'A' ? this.playerA : this.playerB;
    const token = await getValidToken(account);

    // Start playback (which loads + seeks the track on that device)
    await startPlayback(account.deviceId!, [track.spotifyUri], track.startMs, token);
    // Immediately pause — track is now loaded, seeked, and silent
    await player.setVolume(0);
    await player.pause();
  }

  private startScheduler(): void {
    this.stopScheduler();
    // Fallback polling in case player_state_changed events stop firing
    this.pollInterval = setInterval(async () => {
      if (this.state !== 'playing' || this.fadingGuard) return;
      const activeP = this.activePlayer === 'A' ? this.playerA : this.playerB;
      const playbackState = await activeP.getCurrentState().catch(() => null);
      if (!playbackState || playbackState.paused) return;

      const position = playbackState.position;
      this.callbacks.onPosition(position);

      const track = this.tracks[this.currentIndex];
      if (!track) return;

      const fadeStartAt = track.endMs - track.crossfadeOutMs;
      const hardStopAt = track.endMs - 500;

      if ((position >= fadeStartAt || position >= hardStopAt) && !this.fadingGuard) {
        await this.beginCrossfade();
      }
    }, 500);
  }

  private stopScheduler(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private setState(state: EngineState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  get currentTrackIndex(): number {
    return this.currentIndex;
  }

  get engineState(): EngineState {
    return this.state;
  }

  destroy(): void {
    this.stop();
    this.playerA.removeListener('player_state_changed');
    this.playerB.removeListener('player_state_changed');
  }
}
