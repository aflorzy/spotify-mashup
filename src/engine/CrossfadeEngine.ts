// Core crossfade logic — dual-player scheduler.
// Implemented by: feature/engine agent
import type { MixTrack, PlayerAccount } from '../types/mix';
import type { EngineState } from '../types/engine';

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
    throw new Error('Not implemented');
  }

  async start(tracks: MixTrack[]): Promise<void> {
    throw new Error(`Not implemented: ${tracks.length} tracks`);
  }

  pause(): void {
    throw new Error('Not implemented');
  }

  resume(): void {
    throw new Error('Not implemented');
  }

  stop(): void {
    throw new Error('Not implemented');
  }

  skipToNextFade(): void {
    throw new Error('Not implemented');
  }

  private async beginCrossfade(): Promise<void> {
    throw new Error('Not implemented');
  }

  private async completeCrossfade(): Promise<void> {
    throw new Error('Not implemented');
  }

  private async stageTrack(track: MixTrack, player: 'A' | 'B'): Promise<void> {
    throw new Error(`Not implemented: ${track.id} on player ${player}`);
  }

  private startScheduler(): void {
    throw new Error('Not implemented');
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
