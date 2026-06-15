import { create } from 'zustand';

export type MemberStatus = 'active' | 'invited';

export interface OrgCompany {
  name: string;
  plan: string;
}

export interface SeatUsage {
  used: number;
  total: number;
}

export interface OrgMember {
  id: string;
  email: string;
  status: MemberStatus;
  avgScore: number;
}

export interface PerformancePoint {
  label: string;
  score: number;
}

export interface Invitation {
  id: string;
  email: string;
  sentAt: string;
}

interface OrgDashboardState {
  company: OrgCompany;
  seats: SeatUsage;
  members: OrgMember[];
  teamPerformance: PerformancePoint[];
  invitations: Invitation[];
  isLoaded: boolean;
  loadOrgDashboard: () => void;
  inviteMember: (email: string) => { ok: boolean; message: string };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SEED_COMPANY: OrgCompany = { name: 'Acme Corp', plan: 'TEAM' };

const SEED_SEATS: SeatUsage = { used: 12, total: 20 };

const SEED_MEMBERS: OrgMember[] = [
  { id: 'm-1', email: 'maya.patel@acme.dev', status: 'active', avgScore: 88 },
  { id: 'm-2', email: 'leo.nguyen@acme.dev', status: 'active', avgScore: 74 },
  { id: 'm-3', email: 'sara.cohen@acme.dev', status: 'active', avgScore: 91 },
  { id: 'm-4', email: 'devon.ruiz@acme.dev', status: 'active', avgScore: 67 },
  { id: 'm-5', email: 'priya.shah@acme.dev', status: 'invited', avgScore: 0 },
];

const SEED_PERFORMANCE: PerformancePoint[] = [
  { label: 'Maya', score: 88 },
  { label: 'Leo', score: 74 },
  { label: 'Sara', score: 91 },
  { label: 'Devon', score: 67 },
  { label: 'Aria', score: 80 },
];

export const useOrgDashboardStore = create<OrgDashboardState>((set, get) => ({
  company: SEED_COMPANY,
  seats: SEED_SEATS,
  members: SEED_MEMBERS,
  teamPerformance: SEED_PERFORMANCE,
  invitations: [],
  isLoaded: false,
  loadOrgDashboard: () => {
    set({
      company: SEED_COMPANY,
      seats: SEED_SEATS,
      members: SEED_MEMBERS,
      teamPerformance: SEED_PERFORMANCE,
      isLoaded: true,
    });
  },
  inviteMember: (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return { ok: false, message: 'Enter a valid email address.' };
    }
    const state = get();
    const exists =
      state.members.some((member) => member.email === email) ||
      state.invitations.some((invite) => invite.email === email);
    if (exists) {
      return { ok: false, message: 'That person is already a member or invited.' };
    }
    if (state.seats.used >= state.seats.total) {
      return { ok: false, message: 'No seats available. Upgrade your plan to invite more.' };
    }
    const invitation: Invitation = {
      id: `inv-${state.invitations.length + 1}`,
      email,
      sentAt: new Date().toISOString(),
    };
    set({
      invitations: [invitation, ...state.invitations],
      seats: { ...state.seats, used: state.seats.used + 1 },
      members: [
        ...state.members,
        { id: invitation.id, email, status: 'invited', avgScore: 0 },
      ],
    });
    return { ok: true, message: `Invitation sent to ${email}.` };
  },
}));
