import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useMixStore } from '../../store/useMixStore';
import { getValidToken } from '../../services/spotify/auth';
import { getPlaylistTracks } from '../../services/spotify/api';
import { generateId } from '../../utils/uuid';
import type { SpotifyTrack } from '../../types/spotify';
import type { MixTrack } from '../../types/mix';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

function parseSpotifyUrl(input: string): { type: 'track' | 'playlist'; id: string } | null {
  // Handle spotify URIs: spotify:track:xxx or spotify:playlist:xxx
  const uriMatch = input.match(/^spotify:(track|playlist):([A-Za-z0-9]+)$/);
  if (uriMatch) {
    return { type: uriMatch[1] as 'track' | 'playlist', id: uriMatch[2] };
  }

  // Handle open.spotify.com URLs
  const urlMatch = input.match(
    /open\.spotify\.com\/(track|playlist)\/([A-Za-z0-9]+)/
  );
  if (urlMatch) {
    return { type: urlMatch[1] as 'track' | 'playlist', id: urlMatch[2] };
  }

  return null;
}

function spotifyTrackToMixTrack(t: SpotifyTrack): MixTrack {
  return {
    id: generateId(),
    spotifyTrackId: t.id,
    spotifyUri: t.uri,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    albumName: t.album.name,
    albumArt: t.album.images[0]?.url ?? '',
    durationMs: t.duration_ms,
    bpm: null,
    startMs: 0,
    endMs: t.duration_ms,
    crossfadeOutMs: 4000,
    crossfadeInMs: 4000,
    waveform: [],
  };
}

export default function PlaylistImporter() {
  const accountA = useAppStore((s) => s.accountA);
  const addTrack = useMixStore((s) => s.addTrack);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleImport() {
    if (!inputValue.trim()) return;
    if (!accountA) {
      setError('Connect Spotify first');
      return;
    }

    const parsed = parseSpotifyUrl(inputValue.trim());
    if (!parsed) {
      setError('Could not parse Spotify URL or URI. Paste a track or playlist link.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await getValidToken(accountA);

      if (parsed.type === 'track') {
        const res = await fetch(
          `https://api.spotify.com/v1/tracks/${parsed.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Failed to fetch track (${res.status})`);
        const track: SpotifyTrack = await res.json();
        addTrack(spotifyTrackToMixTrack(track));
        setSuccessMsg(`Added "${track.name}"`);
        setInputValue('');
      } else {
        // playlist
        const result = await getPlaylistTracks(parsed.id, token);
        const tracks = result.items
          .map((i) => i.item ?? i.track ?? null)
          .filter((t): t is SpotifyTrack => t !== null && 'duration_ms' in t);

        for (const track of tracks) {
          addTrack(spotifyTrackToMixTrack(track));
        }
        setSuccessMsg(`Added ${tracks.length} tracks from playlist`);
        setInputValue('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleImport();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Paste Spotify link or URI
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
            setSuccessMsg(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="https://open.spotify.com/track/… or spotify:playlist:…"
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 disabled:opacity-50"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleImport}
          disabled={loading || !inputValue.trim()}
        >
          {loading ? <Spinner size="sm" /> : 'Import'}
        </Button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {successMsg && <p className="text-green-400 text-xs">{successMsg}</p>}
    </div>
  );
}
