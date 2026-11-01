import { create } from 'zustand';
import { fetchPendingAccountCount } from '../lib/account-review-api';

const COUNT_MAX_AGE_MS = 60_000;

interface PendingAccountsState {
  count: number;
  fetchedAt: number;
  refreshCount: () => Promise<void>;
  refreshCountIfStale: () => Promise<void>;
  setCount: (count: number) => void;
}

export const usePendingAccountsStore = create<PendingAccountsState>((set, get) => ({
  count: 0,
  fetchedAt: 0,
  refreshCount: async () => {
    try {
      set({ count: await fetchPendingAccountCount(), fetchedAt: Date.now() });
    } catch {
      set({ fetchedAt: Date.now() });
    }
  },
  refreshCountIfStale: async () => {
    if (Date.now() - get().fetchedAt < COUNT_MAX_AGE_MS) {
      return;
    }
    await get().refreshCount();
  },
  setCount: (count) => set({ count, fetchedAt: Date.now() }),
}));
