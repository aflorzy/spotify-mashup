export interface Mix {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: MixTrack[];
}

export interface MixTrack {
  id: string;
  spotifyTrackId: string;
  spotifyUri: string;
  title: string;
  artist: string;
  albumName: string;
  albumArt: string;
  durationMs: number;
  bpm: number | null;
  startMs: number;
  endMs: number;
  crossfadeOutMs: number;
  crossfadeInMs: number;
  waveform: number[];
}

export interface PlayerAccount {
  role: 'A' | 'B';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string | null;
  displayName: string;
}
