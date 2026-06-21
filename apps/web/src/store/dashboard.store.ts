import { create } from 'zustand';
import axios from 'axios';
import type { DashboardStatsDto } from '@elevatesde/shared-types';
import { getDashboardStats } from '@/lib/dashboard-api';

export type QuickActionKey = 'mock-interview' | 'code-sandbox' | 'resume-analysis';

export interface QuickAction {
  key: QuickActionKey;
  title: string;
  description: string;
  href: string;
}

interface DashboardState {
  stats: DashboardStatsDto | null;
  quickActions: QuickAction[];
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'mock-interview',
    title: 'Live Mock Interview',
    description: 'Start a real-time AI interview with adaptive follow-up questions.',
    href: '/dashboard/mock-interview',
  },
  {
    key: 'code-sandbox',
    title: 'Code Assessment Sandbox',
    description: 'Solve timed DSA challenges in an isolated execution environment.',
    href: '/dashboard/assessment',
  },
  {
    key: 'resume-analysis',
    title: 'Resume Analysis',
    description: 'Upload your resume for an instant ATS score and skill breakdown.',
    href: '/dashboard/resume',
  },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  quickActions: QUICK_ACTIONS,
  isLoading: false,
  error: null,
  loadDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await getDashboardStats();
      set({ stats, isLoading: false });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? 'We could not load your dashboard. Please try again.'
        : 'Something went wrong while loading your dashboard.';
      set({ isLoading: false, error: message });
    }
  },
}));
