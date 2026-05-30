// IndexedDB setup and mix CRUD via idb library.
// Implemented by: feature/services agent
import type { Mix } from '../../types/mix';

export async function openDb(): Promise<void> {
  throw new Error('Not implemented');
}

export async function saveMix(mix: Mix): Promise<void> {
  throw new Error(`Not implemented: ${mix.id}`);
}

export async function getMix(id: string): Promise<Mix | undefined> {
  throw new Error(`Not implemented: ${id}`);
}

export async function getAllMixes(): Promise<Mix[]> {
  throw new Error('Not implemented');
}

export async function deleteMix(id: string): Promise<void> {
  throw new Error(`Not implemented: ${id}`);
}
