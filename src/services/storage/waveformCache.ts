import { getDb } from './db';

export async function getCachedWaveform(spotifyTrackId: string): Promise<number[] | undefined> {
  const db = await getDb();
  const record = await db.get('waveforms', spotifyTrackId);
  return record?.waveform;
}

export async function setCachedWaveform(spotifyTrackId: string, waveform: number[]): Promise<void> {
  const db = await getDb();
  await db.put('waveforms', { spotifyTrackId, waveform });
}
