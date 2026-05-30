import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MixTrack } from '../../types/mix';
import { msToDisplay } from '../../utils/time';
import BpmBadge from '../common/BpmBadge';

interface Props {
  track: MixTrack;
  onRemove: () => void;
}

export default function TrackRow({ track, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 touch-none"
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <svg
          width="12"
          height="20"
          viewBox="0 0 12 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="3" cy="17" r="1.5" />
          <circle cx="9" cy="17" r="1.5" />
        </svg>
      </button>

      {/* Album art */}
      {track.albumArt ? (
        <img
          src={track.albumArt}
          alt={track.albumName}
          className="h-10 w-10 rounded object-cover shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-gray-800 shrink-0" />
      )}

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{track.title}</p>
        <p className="text-gray-400 text-xs truncate">{track.artist}</p>
      </div>

      {/* BPM badge */}
      <div className="shrink-0">
        <BpmBadge bpm={track.bpm} />
      </div>

      {/* Duration */}
      <span className="text-gray-500 text-xs shrink-0 tabular-nums">
        {msToDisplay(track.endMs - track.startMs)}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="text-gray-600 hover:text-red-400 transition-colors shrink-0 ml-1"
        aria-label="Remove track"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
