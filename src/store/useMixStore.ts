import { create } from 'zustand';
import type { Mix, MixTrack } from '../types/mix';
import { generateId } from '../utils/uuid';

interface MixState {
  currentMix: Mix | null;
  setMix: (mix: Mix) => void;
  clearMix: () => void;
  createMix: (name: string) => Mix;
  addTrack: (track: MixTrack) => void;
  removeTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  updateTrack: (trackId: string, updates: Partial<MixTrack>) => void;
  updateMixName: (name: string) => void;
}

export const useMixStore = create<MixState>((set, get) => ({
  currentMix: null,

  setMix: (mix) => set({ currentMix: mix }),

  clearMix: () => set({ currentMix: null }),

  createMix: (name) => {
    const mix: Mix = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tracks: [],
    };
    set({ currentMix: mix });
    return mix;
  },

  addTrack: (track) => {
    const { currentMix } = get();
    if (!currentMix) return;
    set({
      currentMix: {
        ...currentMix,
        tracks: [...currentMix.tracks, track],
        updatedAt: Date.now(),
      },
    });
  },

  removeTrack: (trackId) => {
    const { currentMix } = get();
    if (!currentMix) return;
    set({
      currentMix: {
        ...currentMix,
        tracks: currentMix.tracks.filter((t) => t.id !== trackId),
        updatedAt: Date.now(),
      },
    });
  },

  reorderTracks: (fromIndex, toIndex) => {
    const { currentMix } = get();
    if (!currentMix) return;
    const tracks = [...currentMix.tracks];
    const [moved] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, moved);
    set({ currentMix: { ...currentMix, tracks, updatedAt: Date.now() } });
  },

  updateTrack: (trackId, updates) => {
    const { currentMix } = get();
    if (!currentMix) return;
    set({
      currentMix: {
        ...currentMix,
        tracks: currentMix.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
        updatedAt: Date.now(),
      },
    });
  },

  updateMixName: (name) => {
    const { currentMix } = get();
    if (!currentMix) return;
    set({ currentMix: { ...currentMix, name, updatedAt: Date.now() } });
  },
}));
