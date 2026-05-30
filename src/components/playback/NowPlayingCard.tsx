import type { MixTrack } from '../../types/mix';

interface Props {
  track: MixTrack | null;
}

export default function NowPlayingCard({ track }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      {track ? (
        <img
          src={track.albumArt}
          alt={`${track.title} album art`}
          className="w-40 h-40 md:w-[200px] md:h-[200px] rounded-xl shadow-2xl object-cover"
        />
      ) : (
        <div className="w-40 h-40 md:w-[200px] md:h-[200px] rounded-xl shadow-2xl bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500 text-sm">No track</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-xl font-bold text-white truncate max-w-xs">
          {track?.title ?? 'No track'}
        </span>
        <span className="text-gray-400 truncate max-w-xs">
          {track?.artist ?? ''}
        </span>
      </div>
    </div>
  );
}
