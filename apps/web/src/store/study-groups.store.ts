import { create } from 'zustand';
import type {
  CreateStudyGroupRequest,
  StudyGroupActivityItemDto,
  StudyGroupDetailDto,
  StudyGroupGoalInput,
  StudyGroupLeaderboardDto,
  StudyGroupLeaderboardWindow,
  StudyGroupListDto,
  StudyGroupRole,
  UpdateStudyGroupRequest,
} from '@elevatesde/shared-types';
import {
  addStudyGroupMembers,
  archiveStudyGroup,
  createStudyGroup,
  createStudyGroupGoal,
  deleteStudyGroupGoal,
  fetchStudyGroup,
  fetchStudyGroupActivity,
  fetchStudyGroupLeaderboard,
  fetchStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
  removeStudyGroupMember,
  updateStudyGroup,
  updateStudyGroupGoal,
  updateStudyGroupMember,
} from '@/lib/study-groups-api';
import { apiErrorMessage } from '@/lib/public-profile-api';
import { useToastStore } from '@/store/toast.store';

const ACTIVITY_LIMIT = 50;
const ACTIVITY_REFRESH_DELAY_MS = 1500;

let activityRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let latestDetailRequestId: string | null = null;

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface StudyGroupsState {
  list: StudyGroupListDto | null;
  listState: LoadState;
  detail: StudyGroupDetailDto | null;
  detailState: LoadState;
  detailError: string | null;
  leaderboard: StudyGroupLeaderboardDto | null;
  leaderboardWindow: StudyGroupLeaderboardWindow;
  isLeaderboardLoading: boolean;
  activity: StudyGroupActivityItemDto[];
  isActivityLoading: boolean;
  isMutating: boolean;
  loadList: () => Promise<void>;
  loadDetail: (id: string, quiet?: boolean) => Promise<void>;
  loadLeaderboard: (id: string, window?: StudyGroupLeaderboardWindow, quiet?: boolean) => Promise<void>;
  loadActivity: (id: string) => Promise<void>;
  pushActivity: (groupId: string, item: StudyGroupActivityItemDto) => void;
  create: (request: CreateStudyGroupRequest) => Promise<StudyGroupDetailDto | null>;
  update: (id: string, request: UpdateStudyGroupRequest) => Promise<boolean>;
  archive: (id: string) => Promise<boolean>;
  join: (id: string) => Promise<boolean>;
  leave: (id: string) => Promise<boolean>;
  addMembers: (id: string, userIds: string[]) => Promise<boolean>;
  changeRole: (id: string, userId: string, role: StudyGroupRole) => Promise<boolean>;
  removeMember: (id: string, userId: string) => Promise<boolean>;
  saveGoal: (id: string, input: StudyGroupGoalInput, goalId?: string) => Promise<boolean>;
  deleteGoal: (id: string, goalId: string) => Promise<boolean>;
  resetDetail: () => void;
}

function toastError(error: unknown, fallback: string): void {
  useToastStore.getState().addToast(apiErrorMessage(error, fallback), 'error');
}

function toastSuccess(message: string): void {
  useToastStore.getState().addToast(message, 'success');
}

export const useStudyGroupsStore = create<StudyGroupsState>((set, get) => {
  const mutateDetail = async (
    operation: () => Promise<StudyGroupDetailDto>,
    success: string,
    failure: string,
  ): Promise<boolean> => {
    set({ isMutating: true });
    try {
      const detail = await operation();
      set({ detail, isMutating: false });
      toastSuccess(success);
      void get().loadLeaderboard(detail.id, get().leaderboardWindow, true);
      return true;
    } catch (error) {
      set({ isMutating: false });
      toastError(error, failure);
      return false;
    }
  };

  return {
    list: null,
    listState: 'idle',
    detail: null,
    detailState: 'idle',
    detailError: null,
    leaderboard: null,
    leaderboardWindow: 'goal',
    isLeaderboardLoading: false,
    activity: [],
    isActivityLoading: false,
    isMutating: false,

    loadList: async () => {
      set((state) => ({ listState: state.list ? state.listState : 'loading' }));
      try {
        const list = await fetchStudyGroups();
        set({ list, listState: 'ready' });
      } catch (error) {
        set({ listState: 'error' });
        toastError(error, 'Could not load your study groups.');
      }
    },

    loadDetail: async (id, quiet = false) => {
      if (!quiet) {
        set((state) => ({
          detailState: state.detail?.id === id ? state.detailState : 'loading',
          detailError: null,
        }));
      }
      latestDetailRequestId = id;
      try {
        const detail = await fetchStudyGroup(id);
        if (latestDetailRequestId === id) {
          set({ detail, detailState: 'ready', detailError: null });
        }
      } catch (error) {
        if (!quiet && latestDetailRequestId === id) {
          set({
            detail: null,
            detailState: 'error',
            detailError: apiErrorMessage(error, 'This study group could not be loaded.'),
          });
        }
      }
    },

    loadLeaderboard: async (id, window, quiet = false) => {
      const nextWindow = window ?? get().leaderboardWindow;
      set({ leaderboardWindow: nextWindow, isLeaderboardLoading: !quiet });
      try {
        const leaderboard = await fetchStudyGroupLeaderboard(id, nextWindow);
        if (get().leaderboardWindow === nextWindow) {
          set({ leaderboard, isLeaderboardLoading: false });
        }
      } catch (error) {
        set({ isLeaderboardLoading: false });
        if (!quiet) {
          toastError(error, 'Could not load the group leaderboard.');
        }
      }
    },

    loadActivity: async (id) => {
      set({ isActivityLoading: true });
      try {
        const activity = await fetchStudyGroupActivity(id);
        set({ activity, isActivityLoading: false });
      } catch {
        set({ isActivityLoading: false });
      }
    },

    pushActivity: (groupId, item) => {
      if (get().detail?.id !== groupId) {
        return;
      }
      set((state) => ({
        activity: [item, ...state.activity.filter((existing) => existing.id !== item.id)].slice(
          0,
          ACTIVITY_LIMIT,
        ),
      }));
      if (activityRefreshTimer !== null) {
        clearTimeout(activityRefreshTimer);
      }
      activityRefreshTimer = setTimeout(() => {
        activityRefreshTimer = null;
        if (get().detail?.id !== groupId) {
          return;
        }
        void get().loadDetail(groupId, true);
        if (get().leaderboard !== null) {
          void get().loadLeaderboard(groupId, get().leaderboardWindow, true);
        }
      }, ACTIVITY_REFRESH_DELAY_MS);
    },

    create: async (request) => {
      set({ isMutating: true });
      try {
        const detail = await createStudyGroup(request);
        set({ isMutating: false });
        toastSuccess(`${detail.name} is ready.`);
        void get().loadList();
        return detail;
      } catch (error) {
        set({ isMutating: false });
        toastError(error, 'Could not create the group.');
        return null;
      }
    },

    update: (id, request) =>
      mutateDetail(() => updateStudyGroup(id, request), 'Group updated.', 'Could not update the group.'),

    archive: async (id) => {
      set({ isMutating: true });
      try {
        await archiveStudyGroup(id);
        set({ isMutating: false, detail: null, detailState: 'idle' });
        toastSuccess('Group archived.');
        void get().loadList();
        return true;
      } catch (error) {
        set({ isMutating: false });
        toastError(error, 'Could not archive the group.');
        return false;
      }
    },

    join: (id) =>
      mutateDetail(
        async () => {
          const detail = await joinStudyGroup(id);
          void get().loadList();
          return detail;
        },
        'You joined the group.',
        'Could not join the group.',
      ),

    leave: async (id) => {
      set({ isMutating: true });
      try {
        await leaveStudyGroup(id);
        set({ isMutating: false });
        toastSuccess('You left the group.');
        void get().loadList();
        return true;
      } catch (error) {
        set({ isMutating: false });
        toastError(error, 'Could not leave the group.');
        return false;
      }
    },

    addMembers: (id, userIds) =>
      mutateDetail(
        () => addStudyGroupMembers(id, { userIds }),
        userIds.length === 1 ? 'Member added.' : `${userIds.length} members added.`,
        'Could not add members.',
      ),

    changeRole: (id, userId, role) =>
      mutateDetail(
        () => updateStudyGroupMember(id, userId, role),
        role === 'OWNER' ? 'Promoted to owner.' : 'Changed to member.',
        'Could not change the role.',
      ),

    removeMember: (id, userId) =>
      mutateDetail(
        () => removeStudyGroupMember(id, userId),
        'Member removed.',
        'Could not remove the member.',
      ),

    saveGoal: (id, input, goalId) =>
      mutateDetail(
        () => (goalId ? updateStudyGroupGoal(id, goalId, input) : createStudyGroupGoal(id, input)),
        goalId ? 'Goal updated.' : 'Goal added.',
        'Could not save the goal.',
      ),

    deleteGoal: (id, goalId) =>
      mutateDetail(() => deleteStudyGroupGoal(id, goalId), 'Goal deleted.', 'Could not delete the goal.'),

    resetDetail: () =>
      set({
        detail: null,
        detailState: 'idle',
        detailError: null,
        leaderboard: null,
        leaderboardWindow: 'goal',
        activity: [],
      }),
  };
});
