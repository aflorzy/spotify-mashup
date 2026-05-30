import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMixStore } from '../../store/useMixStore';
import { msToDisplay } from '../../utils/time';
import TrackRow from './TrackRow';

export default function TrackList() {
  const currentMix = useMixStore((s) => s.currentMix);
  const removeTrack = useMixStore((s) => s.removeTrack);
  const reorderTracks = useMixStore((s) => s.reorderTracks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentMix) return;

    const tracks = currentMix.tracks;
    const fromIndex = tracks.findIndex((t) => t.id === active.id);
    const toIndex = tracks.findIndex((t) => t.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    reorderTracks(fromIndex, toIndex);
  }

  if (!currentMix) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-gray-600">No mix loaded.</p>
      </div>
    );
  }

  const tracks = currentMix.tracks;
  const totalMs = tracks.reduce((sum, t) => sum + (t.endMs - t.startMs), 0);

  return (
    <div className="flex flex-col h-full">
      {tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-lg mb-2">No tracks yet</p>
          <p className="text-gray-600 text-sm">
            Search or import tracks from the panel on the left
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tracks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onRemove={() => removeTrack(track.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Footer: total runtime */}
      <div className="border-t border-gray-800 pt-3 mt-3 flex justify-between items-center text-sm text-gray-500">
        <span>
          {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
        </span>
        {totalMs > 0 && (
          <span className="tabular-nums">Total: {msToDisplay(totalMs)}</span>
        )}
      </div>
    </div>
  );
}
