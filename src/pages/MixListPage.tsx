import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mix } from '../types/mix';
import { getAllMixes, deleteMix } from '../services/storage/db';
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

export default function MixListPage() {
  const navigate = useNavigate();
  const [mixes, setMixes] = useState<Mix[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Saved Mixes</h1>
        <Button variant="primary" size="md" onClick={() => navigate('/mix/new')}>
          + Create new mix
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : mixes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No saved mixes yet. Create your first mix!</p>
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
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-lg truncate">{mix.name}</h2>
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
                    onClick={() => handleDelete(mix.id)}
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
