export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  items: { total: number };
  tracks?: { total: number }; // deprecated by Spotify, use items.total
  owner: { display_name: string };
}

export interface SpotifyAudioFeatures {
  id: string;
  tempo: number;
  energy: number;
  key: number;
  time_signature: number;
}

export interface SpotifyAudioAnalysisSegment {
  start: number;
  duration: number;
  loudness_max: number;
  loudness_max_time: number;
  loudness_start: number;
}

export interface SpotifyAudioAnalysis {
  segments: SpotifyAudioAnalysisSegment[];
  beats: { start: number; duration: number; confidence: number }[];
  sections: { start: number; duration: number; loudness: number }[];
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    next: string | null;
    total: number;
  };
}

export interface SpotifyPlaylistTracksResult {
  items: { item: SpotifyTrack | null; track?: SpotifyTrack | null }[];
  next: string | null;
  total: number;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  product: string;
}

