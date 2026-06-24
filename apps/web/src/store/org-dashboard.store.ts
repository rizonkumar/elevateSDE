import { create } from 'zustand';
import type {
  InvitationDto,
  OrgCompanyDto,
  OrgMemberDto,
  OrgPerformancePointDto,
  SeatUsageDto,
} from '@elevatesde/shared-types';
import { createInvitation, fetchOrgOverview, revokeInvitation } from '@/lib/org-api';
import { useToastStore } from '@/store/toast.store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_COMPANY: OrgCompanyDto = { name: '', plan: '' };

const EMPTY_SEATS: SeatUsageDto = { used: 0, total: 0 };

export interface InviteResult {
  ok: boolean;
  message: string;
  inviteUrl?: string;
}

interface OrgDashboardState {
  company: OrgCompanyDto;
  seats: SeatUsageDto;
  members: OrgMemberDto[];
  teamPerformance: OrgPerformancePointDto[];
  invitations: InvitationDto[];
  isLoaded: boolean;
  isLoading: boolean;
  lastInviteUrl: string | null;
  loadOrgDashboard: () => Promise<void>;
  inviteMember: (email: string) => Promise<InviteResult>;
  revoke: (id: string) => Promise<void>;
  clearInviteUrl: () => void;
}

export const useOrgDashboardStore = create<OrgDashboardState>((set, get) => ({
  company: EMPTY_COMPANY,
  seats: EMPTY_SEATS,
  members: [],
  teamPerformance: [],
  invitations: [],
  isLoaded: false,
  isLoading: false,
  lastInviteUrl: null,

  loadOrgDashboard: async () => {
    set({ isLoading: true });
    try {
      const overview = await fetchOrgOverview();
      set({
        company: overview.company,
        seats: overview.seats,
        members: overview.members,
        teamPerformance: overview.teamPerformance,
        invitations: overview.invitations,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      useToastStore
        .getState()
        .addToast(extractMessage(error, 'Could not load your organization.'), 'error');
    }
  },

  inviteMember: async (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return { ok: false, message: 'Enter a valid email address.' };
    }
    try {
      const created = await createInvitation(email);
      set({ lastInviteUrl: created.inviteUrl });
      await get().loadOrgDashboard();
      return { ok: true, message: `Invite link ready for ${email}.`, inviteUrl: created.inviteUrl };
    } catch (error) {
      return { ok: false, message: extractMessage(error, 'Could not create the invitation.') };
    }
  },

  revoke: async (id) => {
    try {
      await revokeInvitation(id);
      await get().loadOrgDashboard();
      useToastStore.getState().addToast('Invitation revoked.', 'success');
    } catch (error) {
      useToastStore
        .getState()
        .addToast(extractMessage(error, 'Could not revoke the invitation.'), 'error');
    }
  },

  clearInviteUrl: () => set({ lastInviteUrl: null }),
}));

function extractMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}
