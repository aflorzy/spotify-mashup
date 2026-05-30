import { openDB, type IDBPDatabase } from 'idb';
import type { Mix } from '../../types/mix';

const DB_NAME = 'mashup-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('mixes')) {
          const mixStore = db.createObjectStore('mixes', { keyPath: 'id' });
          mixStore.createIndex('updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('waveforms')) {
          db.createObjectStore('waveforms', { keyPath: 'spotifyTrackId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function openDb(): Promise<void> {
  await getDb();
}

export async function saveMix(mix: Mix): Promise<void> {
  const db = await getDb();
  await db.put('mixes', mix);
}

export async function getMix(id: string): Promise<Mix | undefined> {
  const db = await getDb();
  return db.get('mixes', id);
}

export async function getAllMixes(): Promise<Mix[]> {
  const db = await getDb();
  return db.getAllFromIndex('mixes', 'updatedAt');
}

export async function deleteMix(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('mixes', id);
}
