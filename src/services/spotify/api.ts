import type {
  SpotifySearchResult, SpotifyPlaylist, SpotifyPlaylistTracksResult,
  SpotifyAudioFeatures, SpotifyAudioAnalysis, SpotifyUserProfile,
} from '../../types/spotify';

const BASE = 'https://api.spotify.com/v1';

async function apiFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('Spotify API error', { method: options.method ?? 'GET', url: `${BASE}${path}`, status: res.status, body: text });
    throw new Error(`Spotify API ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function searchTracks(query: string, token: string, limit = 10): Promise<SpotifySearchResult> {
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  return apiFetch<SpotifySearchResult>(`/search?${params}`, token);
}

export async function getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  const results: SpotifyPlaylist[] = [];
  let url: string | null = `/me/playlists?limit=50`;
  while (url) {
    const page: { items: SpotifyPlaylist[]; next: string | null } = await apiFetch<{ items: SpotifyPlaylist[]; next: string | null }>(url, token);
    results.push(...page.items);
    url = page.next ? page.next.replace(BASE, '') : null;
  }
  return results;
}

export async function getPlaylistTracks(playlistId: string, token: string): Promise<SpotifyPlaylistTracksResult> {
  return apiFetch<SpotifyPlaylistTracksResult>(`/playlists/${playlistId}/tracks?limit=100`, token);
}

export async function getAudioFeatures(trackId: string, token: string): Promise<SpotifyAudioFeatures> {
  return apiFetch<SpotifyAudioFeatures>(`/audio-features/${trackId}`, token);
}

export async function getAudioAnalysis(trackId: string, token: string): Promise<SpotifyAudioAnalysis> {
  return apiFetch<SpotifyAudioAnalysis>(`/audio-analysis/${trackId}`, token);
}

export async function getUserProfile(token: string): Promise<SpotifyUserProfile> {
  return apiFetch<SpotifyUserProfile>(`/me`, token);
}

export async function startPlayback(deviceId: string, uris: string[], positionMs: number, token: string): Promise<void> {
  return apiFetch<void>(`/me/player/play?device_id=${deviceId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ uris, position_ms: positionMs }),
  });
}

export async function pausePlayback(deviceId: string, token: string): Promise<void> {
  return apiFetch<void>(`/me/player/pause?device_id=${deviceId}`, token, { method: 'PUT' });
}

export async function seekPlayback(deviceId: string, positionMs: number, token: string): Promise<void> {
  return apiFetch<void>(`/me/player/seek?device_id=${deviceId}&position_ms=${positionMs}`, token, { method: 'PUT' });
}
