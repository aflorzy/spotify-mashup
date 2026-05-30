import { create } from 'zustand';
import type { PlayerAccount } from '../types/mix';

interface AppState {
  accountA: PlayerAccount | null;
  accountB: PlayerAccount | null;
  setAccountA: (account: PlayerAccount | null) => void;
  setAccountB: (account: PlayerAccount | null) => void;
  clearAccounts: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  accountA: null,
  accountB: null,
  setAccountA: (account) => set({ accountA: account }),
  setAccountB: (account) => set({ accountB: account }),
  clearAccounts: () => set({ accountA: null, accountB: null }),
}));
