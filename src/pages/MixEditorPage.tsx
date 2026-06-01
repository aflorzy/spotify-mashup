import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMixStore } from '../store/useMixStore';
import { getMix, saveMix } from '../services/storage/db';
import MixEditorStrip from '../components/editor/MixEditorStrip';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { PreviewPlayerProvider } from '../contexts/PreviewPlayerContext';

export default function MixEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentMix = useMixStore((s) => s.currentMix);
  const setMix = useMixStore((s) => s.setMix);

  const updateMixName = useMixStore((s) => s.updateMixName);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load mix on mount if not already loaded
  useEffect(() => {
    if (!id) return;
    if (currentMix?.id === id) return;

    setLoading(true);
    getMix(id)
      .then((mix) => {
        if (mix) {
          setMix(mix);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, currentMix?.id, setMix]);

  // Auto-save with debounce
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentMix) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveMix(currentMix).catch(console.error);
    }, 1000);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [currentMix]);

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

  const handleSave = async () => {
    if (!currentMix) return;
    setSaving(true);
    try {
      await saveMix(currentMix);
      navigate('/mixes');
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    if (!currentMix) return;
    const json = JSON.stringify(currentMix, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMix.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found
  if (notFound || (!loading && !currentMix)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
        <p className="text-lg">Mix not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/mixes')}>
          Back to mixes
        </Button>
      </div>
    );
  }

  if (!currentMix) return null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/mixes')}
            className="text-gray-400 hover:text-white transition-colors text-lg"
            aria-label="Back"
          >
            ←
          </button>
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleNameKeyDown}
              aria-label="Mix name"
              className="bg-gray-800 border border-green-500 rounded-lg px-2 py-1 text-white font-bold text-xl focus:outline-none min-w-0 w-full max-w-xs"
            />
          ) : (
            <div className="flex items-center gap-1.5 group cursor-pointer min-w-0" onClick={startEditName} title="Click to rename">
              <h1 className="text-xl font-bold text-white truncate">{currentMix.name}</h1>
              <span className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-base" aria-label="Rename mix">&#9999;</span>
            </div>
          )}
          <span className="text-xs text-gray-500 shrink-0">
            {currentMix.tracks.length} track{currentMix.tracks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/mix/${currentMix.id}/build`)}
            title="Add more songs to this mix"
          >
            + Add songs
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportJson}
            title="Export mix as JSON"
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/mix/${currentMix.id}/play`)}
          >
            Start Mix →
          </Button>
        </div>
      </div>

      {/* Track list — wrapped in PreviewPlayerProvider so each strip can
          use the shared preview player. Provider only initialises the SDK
          iframe when accountA is connected. */}
      <PreviewPlayerProvider>
        {currentMix.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-500 border border-dashed border-gray-700 rounded-xl">
            <p>No tracks in this mix.</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/mix/new')}>
              Go back to the builder
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentMix.tracks.map((track, index) => (
              <MixEditorStrip
                key={track.id}
                track={track}
                index={index}
                isLast={index === currentMix.tracks.length - 1}
                nextTrack={currentMix.tracks[index + 1]}
              />
            ))}
          </div>
        )}
      </PreviewPlayerProvider>
    </div>
  );
}
