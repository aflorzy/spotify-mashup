import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mix } from '../types/mix';
import { getAllMixes, deleteMix, saveMix } from '../services/storage/db';
import { generateId } from '../utils/uuid';
import { msToDisplay } from '../utils/time';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

function totalRuntime(mix: Mix): number {
  return mix.tracks.reduce((sum, t) => sum + (t.endMs - t.startMs), 0);
}

function exportMixJson(mix: Mix) {
  const blob = new Blob([JSON.stringify(mix, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${mix.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateMix(data: unknown): data is Mix {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id) return false;
  if (typeof obj.name !== 'string' || !obj.name) return false;
  if (!Array.isArray(obj.tracks)) return false;
  return true;
}

export default function MixListPage() {
  const navigate = useNavigate();
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadMixes() {
    setLoading(true);
    try {
      const all = await getAllMixes();
      // sort by updatedAt descending
      all.sort((a, b) => b.updatedAt - a.updatedAt);
      setMixes(all);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMixes();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteMix(id);
      await loadMixes();
    } finally {
      setDeletingId(null);
    }
  }

  function handleDeleteWithConfirm(mix: Mix) {
    if (!window.confirm(`Delete "${mix.name}"? This cannot be undone.`)) return;
    handleDelete(mix.id);
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    // Reset so the same file can be re-imported if needed
    fileInputRef.current.value = '';
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setImportError('Invalid JSON file. Please select a valid mix export.');
        return;
      }

      if (!validateMix(parsed)) {
        setImportError('File does not look like a MashUp mix. Missing required fields (id, name, tracks).');
        return;
      }

      const now = Date.now();
      const imported: Mix = {
        ...parsed,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      await saveMix(imported);
      await loadMixes();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import mix.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Saved Mixes</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={handleImportClick}
            disabled={importing}
          >
            {importing ? 'Importing…' : 'Import mix'}
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/mix/new')}>
            + Create new mix
          </Button>
        </div>
      </div>

      {/* Import error banner */}
      {importError && (
        <div className="flex items-start gap-3 bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 mb-6">
          <p className="text-red-300 text-sm flex-1">{importError}</p>
          <button
            onClick={() => setImportError(null)}
            className="text-red-400 hover:text-red-200 transition-colors text-lg leading-none shrink-0"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : mixes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-2">No mixes yet.</p>
          <p className="text-gray-600 text-sm mb-6">Create your first one or import a mix JSON file.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/mix/new')}>
            Create your first mix
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {mixes.map((mix) => {
            const runtime = totalRuntime(mix);
            return (
              <div
                key={mix.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info — clicking the name navigates to the editor */}
                <div
                  className="flex-1 min-w-0 cursor-pointer group"
                  onClick={() => navigate(`/mix/${mix.id}/edit`)}
                >
                  <h2 className="text-white font-semibold text-lg truncate group-hover:text-green-400 transition-colors">
                    {mix.name}
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {mix.tracks.length} {mix.tracks.length === 1 ? 'track' : 'tracks'}
                    {runtime > 0 && <> · {msToDisplay(runtime)}</>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/mix/${mix.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/mix/${mix.id}/play`)}
                  >
                    Play
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportMixJson(mix)}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deletingId === mix.id}
                    onClick={() => handleDeleteWithConfirm(mix)}
                  >
                    {deletingId === mix.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
