import type { MixTrack } from '../../types/mix';

interface Props {
  track: MixTrack | null;
}

export default function NextUpCard({ track }: Props) {
  if (!track) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl max-w-sm w-full">
      <img
        src={track.albumArt}
        alt={`${track.title} album art`}
        className="w-12 h-12 rounded-lg object-cover shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Up Next</span>
        <span className="text-sm font-medium text-gray-300 truncate">{track.title}</span>
        <span className="text-xs text-gray-500 truncate">{track.artist}</span>
      </div>
    </div>
  );
}
