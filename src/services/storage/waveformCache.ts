// IndexedDB waveform cache — avoids repeated Audio Analysis API calls.
// Implemented by: feature/services agent

export async function getCachedWaveform(spotifyTrackId: string): Promise<number[] | undefined> {
  throw new Error(`Not implemented: ${spotifyTrackId}`);
}

export async function setCachedWaveform(spotifyTrackId: string, waveform: number[]): Promise<void> {
  throw new Error(`Not implemented: ${spotifyTrackId} ${waveform.length}`);
}
