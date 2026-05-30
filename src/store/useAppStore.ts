import { create } from 'zustand';
import type { PlayerAccount } from '../types/mix';

interface AppState {
  accountA: PlayerAccount | null;
  accountB: PlayerAccount | null;
  sdkReady: boolean;
  setAccountA: (account: PlayerAccount | null) => void;
  setAccountB: (account: PlayerAccount | null) => void;
  setSdkReady: (ready: boolean) => void;
  clearAccounts: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  accountA: null,
  accountB: null,
  sdkReady: false,
  setAccountA: (account) => set({ accountA: account }),
  setAccountB: (account) => set({ accountB: account }),
  setSdkReady: (ready) => set({ sdkReady: ready }),
  clearAccounts: () => set({ accountA: null, accountB: null }),
}));
