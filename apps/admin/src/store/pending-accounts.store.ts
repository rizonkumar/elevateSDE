import { create } from 'zustand';
import { fetchPendingAccountCount } from '../lib/account-review-api';

interface PendingAccountsState {
  count: number;
  refreshCount: () => Promise<void>;
  setCount: (count: number) => void;
}

export const usePendingAccountsStore = create<PendingAccountsState>((set) => ({
  count: 0,
  refreshCount: async () => {
    try {
      set({ count: await fetchPendingAccountCount() });
    } catch {
      set({ count: 0 });
    }
  },
  setCount: (count) => set({ count }),
}));
