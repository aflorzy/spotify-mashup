import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMixStore } from '../store/useMixStore';
import { saveMix } from '../services/storage/db';
import Button from '../components/common/Button';
import TrackSearchPanel from '../components/builder/TrackSearchPanel';
import TrackList from '../components/builder/TrackList';
import PlaylistImporter from '../components/builder/PlaylistImporter';

export default function MixBuilderPage() {
  const navigate = useNavigate();
  const currentMix = useMixStore((s) => s.currentMix);
  const createMix = useMixStore((s) => s.createMix);
  const updateMixName = useMixStore((s) => s.updateMixName);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Create a new mix if none is loaded
  useEffect(() => {
    if (!currentMix) {
      createMix('New Mix');
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save whenever the mix changes
  useEffect(() => {
    if (currentMix) {
      saveMix(currentMix).catch(() => {/* silently ignore */});
    }
  }, [currentMix]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  function startEditName() {
    if (!currentMix) return;
    setNameInput(currentMix.name);
    setEditingName(true);
  }

  function commitName() {
    const trimmed = nameInput.trim();
    if (trimmed) updateMixName(trimmed);
    setEditingName(false);
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') setEditingName(false);
  }

  if (!currentMix) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Initializing mix…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              className="bg-gray-800 border border-green-500 rounded-lg px-2 py-1 text-white font-semibold text-lg focus:outline-none min-w-0 w-full"
            />
          ) : (
            <button
              onClick={startEditName}
              className="text-white font-semibold text-lg hover:text-green-400 transition-colors text-left truncate"
              title="Click to rename"
            >
              {currentMix.name}
            </button>
          )}
          <span className="text-gray-600 text-sm shrink-0">
            {currentMix.tracks.length} {currentMix.tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/mix/${currentMix.id}/edit`)}
          disabled={currentMix.tracks.length === 0}
        >
          Edit Mix →
        </Button>
      </div>

      {/* Main layout: sidebar + track list */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left sidebar */}
        <aside className="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-950 flex flex-col max-h-[50vh] md:max-h-none">
          <div className="flex-1 overflow-y-auto p-4">
            <TrackSearchPanel />
          </div>
          <div className="border-t border-gray-800 p-4">
            <PlaylistImporter />
          </div>
        </aside>

        {/* Main: track list */}
        <main className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
          <TrackList />
        </main>
      </div>
    </div>
  );
}
