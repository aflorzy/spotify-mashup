// Ambient declarations for the Spotify Web Playback SDK (loaded via script tag in index.html)

declare namespace Spotify {
  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    position: number;
    duration: number;
    paused: boolean;
    track_window: {
      current_track: {
        id: string;
        uri: string;
        name: string;
        artists: { name: string }[];
        album: { name: string; images: { url: string }[] };
        duration_ms: number;
      };
      next_tracks: unknown[];
      previous_tracks: unknown[];
    };
  }

  interface WebPlaybackError {
    message: string;
  }

  class Player {
    constructor(options: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    resume(): Promise<void>;
    pause(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
    getCurrentState(): Promise<PlaybackState | null>;
    activateElement(): Promise<void>;
    addListener(event: 'ready', cb: (data: { device_id: string }) => void): boolean;
    addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): boolean;
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): boolean;
    addListener(event: 'initialization_error', cb: (err: WebPlaybackError) => void): boolean;
    addListener(event: 'authentication_error', cb: (err: WebPlaybackError) => void): boolean;
    addListener(event: 'account_error', cb: (err: WebPlaybackError) => void): boolean;
    removeListener(event: string, cb?: (...args: unknown[]) => void): boolean;
  }
}

declare interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: typeof Spotify;
}
