import { useEffect } from 'react';
import type { MixTrack } from '../../types/mix';
import { useMixStore } from '../../store/useMixStore';
import { useWaveform } from '../../hooks/useWaveform';
import { msToDisplay } from '../../utils/time';
import Waveform from './Waveform';
import CrossfadeOverlapIndicator from './CrossfadeOverlapIndicator';
import TransitionPreviewButton from './TransitionPreviewButton';
import Spinner from '../common/Spinner';
import BpmBadge from '../common/BpmBadge';

interface MixEditorStripProps {
  track: MixTrack;
  index: number;
  isLast: boolean;
  nextTrack?: MixTrack;
}

export default function MixEditorStrip({ track, index, isLast, nextTrack }: MixEditorStripProps) {
  const updateTrack = useMixStore((s) => s.updateTrack);
  const { waveform, loading: waveformLoading } = useWaveform(track.spotifyTrackId);

  // Persist waveform data once loaded
  useEffect(() => {
    if (waveform.length > 0 && track.waveform.length === 0) {
      updateTrack(track.id, { waveform });
    }
  }, [waveform, track.id, track.waveform.length, updateTrack]);

  const displayWaveform = track.waveform.length > 0 ? track.waveform : waveform;

  const totalDuration = msToDisplay(track.durationMs);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Track header */}
      <div className="flex items-center gap-3">
        <span className="text-gray-600 text-sm font-mono w-5 shrink-0 select-none">
          {index + 1}
        </span>
        {track.albumArt && (
          <img
            src={track.albumArt}
            alt={track.title}
            className="w-12 h-12 rounded object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{track.title}</p>
          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BpmBadge bpm={track.bpm} />
          <span className="text-gray-400 text-sm font-mono">{totalDuration}</span>
        </div>
      </div>

      {/* Waveform */}
      <div className="relative">
        {waveformLoading && displayWaveform.length === 0 ? (
          <div className="flex items-center justify-center h-16 gap-2 text-gray-500 text-sm">
            <Spinner size="sm" />
            <span>Loading waveform…</span>
          </div>
        ) : (
          <Waveform
            waveform={displayWaveform}
            durationMs={track.durationMs}
            startMs={track.startMs}
            endMs={track.endMs}
            onStartChange={(ms) => updateTrack(track.id, { startMs: Math.round(ms) })}
            onEndChange={(ms) => updateTrack(track.id, { endMs: Math.round(ms) })}
          />
        )}
      </div>

      {/* Crossfade control */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span>Crossfade:</span>
          <input
            type="number"
            min={0}
            max={12}
            step={0.5}
            value={track.crossfadeOutMs / 1000}
            onChange={(e) => {
              const val = Math.max(0, Math.min(12, parseFloat(e.target.value) || 0));
              updateTrack(track.id, { crossfadeOutMs: Math.round(val * 1000) });
            }}
            className="w-16 rounded bg-gray-800 border border-gray-700 text-white text-sm px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <span className="text-gray-400">s</span>
        </label>

        {/* Trim duration display */}
        <span className="text-xs text-gray-500 font-mono">
          Trimmed: {msToDisplay(track.startMs)} – {msToDisplay(track.endMs)}
          {' '}({msToDisplay(track.endMs - track.startMs)})
        </span>
      </div>

      {/* Transition row: preview button + overlap indicator */}
      {!isLast && nextTrack && (
        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-800">
          <TransitionPreviewButton
            trackId={track.id}
            spotifyUri={track.spotifyUri}
            nextTrackId={nextTrack.id}
            startMs={track.startMs}
            endMs={track.endMs}
            crossfadeOutMs={track.crossfadeOutMs}
          />
          <CrossfadeOverlapIndicator
            crossfadeOutMs={track.crossfadeOutMs}
            crossfadeInMs={nextTrack.crossfadeInMs}
            prevTrackStartMs={track.startMs}
            prevTrackEndMs={track.endMs}
            nextTrackStartMs={nextTrack.startMs}
            nextTrackEndMs={nextTrack.endMs}
          />
        </div>
      )}
    </div>
  );
}
