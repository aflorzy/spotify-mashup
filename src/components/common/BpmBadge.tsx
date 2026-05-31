export default function BpmBadge({ bpm }: { bpm: number | null }) {
  if (bpm !== null && bpm > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-900/60 px-2 py-0.5 text-xs font-medium text-purple-200">
        {Math.round(bpm)} BPM
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500"
      title="BPM unavailable — Spotify API change (Nov 2024)"
    >
      — BPM
    </span>
  );
}
