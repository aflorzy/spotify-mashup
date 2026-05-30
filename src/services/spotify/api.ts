// Typed wrappers for Spotify REST API endpoints.
// Implemented by: feature/services agent
import type {
  SpotifySearchResult,
  SpotifyPlaylist,
  SpotifyPlaylistTracksResult,
  SpotifyAudioFeatures,
  SpotifyAudioAnalysis,
  SpotifyUserProfile,
} from '../../types/spotify';

export async function searchTracks(query: string, token: string, limit = 20): Promise<SpotifySearchResult> {
  throw new Error(`Not implemented: ${query} ${token} ${limit}`);
}

export async function getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  throw new Error(`Not implemented: ${token}`);
}

export async function getPlaylistTracks(playlistId: string, token: string): Promise<SpotifyPlaylistTracksResult> {
  throw new Error(`Not implemented: ${playlistId} ${token}`);
}

export async function getAudioFeatures(trackId: string, token: string): Promise<SpotifyAudioFeatures> {
  throw new Error(`Not implemented: ${trackId} ${token}`);
}

export async function getAudioAnalysis(trackId: string, token: string): Promise<SpotifyAudioAnalysis> {
  throw new Error(`Not implemented: ${trackId} ${token}`);
}

export async function getUserProfile(token: string): Promise<SpotifyUserProfile> {
  throw new Error(`Not implemented: ${token}`);
}

export async function startPlayback(
  deviceId: string,
  uris: string[],
  positionMs: number,
  token: string,
): Promise<void> {
  throw new Error(`Not implemented: ${deviceId} ${uris} ${positionMs} ${token}`);
}

export async function pausePlayback(deviceId: string, token: string): Promise<void> {
  throw new Error(`Not implemented: ${deviceId} ${token}`);
}

export async function seekPlayback(deviceId: string, positionMs: number, token: string): Promise<void> {
  throw new Error(`Not implemented: ${deviceId} ${positionMs} ${token}`);
}
