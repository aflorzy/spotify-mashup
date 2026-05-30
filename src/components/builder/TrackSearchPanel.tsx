import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useMixStore } from '../../store/useMixStore';
import { searchTracks, getUserPlaylists, getPlaylistTracks } from '../../services/spotify/api';
import { getValidToken } from '../../services/spotify/auth';
import { generateId } from '../../utils/uuid';
import { msToDisplay } from '../../utils/time';
import { debounce } from '../../utils/debounce';
import type { SpotifyTrack, SpotifyPlaylist } from '../../types/spotify';
import type { MixTrack } from '../../types/mix';
import BpmBadge from '../common/BpmBadge';
import Spinner from '../common/Spinner';

type Tab = 'search' | 'playlists';

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

interface TrackResultRowProps {
  track: SpotifyTrack;
  onAdd: (t: SpotifyTrack) => void;
}

function TrackResultRow({ track, onAdd }: TrackResultRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-gray-800 group transition-colors">
      {track.album.images[0] ? (
        <img
          src={track.album.images[0].url}
          alt={track.album.name}
          className="h-10 w-10 rounded object-cover shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-gray-800 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{track.name}</p>
        <p className="text-gray-400 text-xs truncate">
          {track.artists.map((a) => a.name).join(', ')}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <BpmBadge bpm={null} />
        <span className="text-gray-500 text-xs tabular-nums hidden sm:block">
          {msToDisplay(track.duration_ms)}
        </span>
        <button
          onClick={() => onAdd(track)}
          className="text-gray-500 hover:text-green-400 transition-colors text-lg font-bold leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700"
          aria-label={`Add ${track.name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function TrackSearchPanel() {
  const accountA = useAppStore((s) => s.accountA);
  const addTrack = useMixStore((s) => s.addTrack);

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [playlistTracksLoading, setPlaylistTracksLoading] = useState(false);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || !accountA) return;
      setSearchLoading(true);
      setSearchError(null);
      try {
        const token = await getValidToken(accountA);
        const result = await searchTracks(q, token);
        setSearchResults(result.tracks.items);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [accountA]
  );

  // Track latest query in a ref to avoid stale closure issues
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    if (query.trim()) {
      doSearch(query);
    } else {
      setSearchResults([]);
      setSearchError(null);
    }
  }, [query, doSearch]);

  async function loadPlaylists() {
    if (!accountA) return;
    setPlaylistsLoading(true);
    setPlaylistsError(null);
    try {
      const token = await getValidToken(accountA);
      const result = await getUserPlaylists(token);
      setPlaylists(result);
    } catch (err) {
      setPlaylistsError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setPlaylistsLoading(false);
    }
  }

  async function handleSelectPlaylist(playlist: SpotifyPlaylist) {
    if (!accountA) return;
    setSelectedPlaylist(playlist);
    setPlaylistTracksLoading(true);
    try {
      const token = await getValidToken(accountA);
      const result = await getPlaylistTracks(playlist.id, token);
      const tracks = result.items
        .map((item) => item.track)
        .filter((t): t is SpotifyTrack => t !== null);
      setPlaylistTracks(tracks);
    } catch {
      setPlaylistTracks([]);
    } finally {
      setPlaylistTracksLoading(false);
    }
  }

  function handleAddTrack(t: SpotifyTrack) {
    addTrack(spotifyTrackToMixTrack(t));
  }

  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    if (newTab === 'playlists' && playlists.length === 0 && accountA) {
      loadPlaylists();
    }
  }

  const tabBase =
    'flex-1 py-2 text-sm font-medium transition-colors rounded-lg';
  const tabActive = 'bg-gray-800 text-white';
  const tabInactive = 'text-gray-500 hover:text-gray-300';

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-950 rounded-lg p-1 mb-4">
        <button
          className={`${tabBase} ${tab === 'search' ? tabActive : tabInactive}`}
          onClick={() => handleTabChange('search')}
        >
          Search
        </button>
        <button
          className={`${tabBase} ${tab === 'playlists' ? tabActive : tabInactive}`}
          onClick={() => handleTabChange('playlists')}
        >
          My Playlists
        </button>
      </div>

      {!accountA && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center px-4">
            Connect Spotify to search for tracks
          </p>
        </div>
      )}

      {accountA && tab === 'search' && (
        <div className="flex flex-col flex-1 min-h-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 mb-3"
          />

          {searchLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {searchError && (
            <p className="text-red-400 text-xs px-1 mb-2">{searchError}</p>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              {searchResults.map((track) => (
                <TrackResultRow key={track.id} track={track} onAdd={handleAddTrack} />
              ))}
            </div>
          )}

          {!searchLoading && !searchError && query.trim() && searchResults.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No tracks found for that search.</p>
          )}

          {!query.trim() && (
            <p className="text-gray-600 text-sm text-center py-8">
              Type to search Spotify
            </p>
          )}
        </div>
      )}

      {accountA && tab === 'playlists' && (
        <div className="flex flex-col flex-1 min-h-0">
          {playlistsLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {playlistsError && (
            <p className="text-red-400 text-xs px-1 mb-2">{playlistsError}</p>
          )}

          {!playlistsLoading && !selectedPlaylist && playlists.length > 0 && (
            <div className="flex-1 overflow-y-auto flex flex-col gap-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleSelectPlaylist(pl)}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-800 transition-colors text-left w-full"
                >
                  {pl.images[0] ? (
                    <img
                      src={pl.images[0].url}
                      alt={pl.name}
                      className="h-9 w-9 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded bg-gray-800 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{pl.name}</p>
                    <p className="text-gray-500 text-xs">{pl.tracks.total} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!playlistsLoading && !selectedPlaylist && playlists.length === 0 && !playlistsError && (
            <p className="text-gray-600 text-sm text-center py-8">No playlists found</p>
          )}

          {selectedPlaylist && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => { setSelectedPlaylist(null); setPlaylistTracks([]); }}
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  ← Back
                </button>
                <span className="text-white text-sm font-medium truncate">
                  {selectedPlaylist.name}
                </span>
              </div>

              {playlistTracksLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {playlistTracks.map((track) => (
                    <TrackResultRow key={track.id} track={track} onAdd={handleAddTrack} />
                  ))}
                  {playlistTracks.length === 0 && (
                    <p className="text-gray-600 text-sm text-center py-8">No tracks</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
