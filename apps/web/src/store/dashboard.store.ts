import { create } from 'zustand';

export type QuickActionKey = 'mock-interview' | 'code-sandbox' | 'resume-analysis';

export type ActivityType = 'interview' | 'assessment' | 'resume' | 'goal';

export interface CandidateStats {
  interviewsCompleted: number;
  avgAiScore: number;
  activeGoals: number;
}

export interface QuickAction {
  key: QuickActionKey;
  title: string;
  description: string;
  href: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  label: string;
  detail: string;
  timestamp: string;
}

export interface FocusArea {
  id: string;
  label: string;
  progress: number;
}

interface DashboardState {
  stats: CandidateStats;
  quickActions: QuickAction[];
  activityLog: ActivityItem[];
  focusAreas: FocusArea[];
  isLoaded: boolean;
  loadDashboard: () => void;
}

const SEED_STATS: CandidateStats = {
  interviewsCompleted: 7,
  avgAiScore: 82,
  activeGoals: 3,
};

const SEED_QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'mock-interview',
    title: 'Live Mock Interview',
    description: 'Start a real-time AI interview with adaptive follow-up questions.',
    href: '/dashboard',
  },
  {
    key: 'code-sandbox',
    title: 'Code Assessment Sandbox',
    description: 'Solve timed DSA challenges in an isolated execution environment.',
    href: '/dashboard',
  },
  {
    key: 'resume-analysis',
    title: 'Resume Analysis',
    description: 'Upload your resume for an instant ATS score and skill breakdown.',
    href: '/dashboard',
  },
];

const SEED_ACTIVITY: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'interview',
    label: 'System Design mock interview',
    detail: 'Scored 88 · Rate limiter design',
    timestamp: '2026-06-14T09:30:00.000Z',
  },
  {
    id: 'act-2',
    type: 'assessment',
    label: 'Dynamic Programming assessment',
    detail: 'Scored 79 · 3 of 4 solved',
    timestamp: '2026-06-12T16:10:00.000Z',
  },
  {
    id: 'act-3',
    type: 'resume',
    label: 'Resume re-analyzed',
    detail: 'ATS score improved to 91',
    timestamp: '2026-06-10T11:45:00.000Z',
  },
  {
    id: 'act-4',
    type: 'goal',
    label: 'Goal updated',
    detail: 'Backend SDE-2 track · 60% complete',
    timestamp: '2026-06-08T08:00:00.000Z',
  },
];

const SEED_FOCUS: FocusArea[] = [
  { id: 'focus-1', label: 'Data Structures & Algorithms', progress: 72 },
  { id: 'focus-2', label: 'System Design', progress: 54 },
  { id: 'focus-3', label: 'Behavioral & Storytelling', progress: 38 },
  { id: 'focus-4', label: 'Resume & ATS readiness', progress: 91 },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: SEED_STATS,
  quickActions: SEED_QUICK_ACTIONS,
  activityLog: SEED_ACTIVITY,
  focusAreas: SEED_FOCUS,
  isLoaded: false,
  loadDashboard: () => {
    set({
      stats: SEED_STATS,
      quickActions: SEED_QUICK_ACTIONS,
      activityLog: SEED_ACTIVITY,
      focusAreas: SEED_FOCUS,
      isLoaded: true,
    });
  },
}));
