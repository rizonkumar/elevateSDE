import { create } from 'zustand';
import axios from 'axios';
import type {
  AiReadinessExplanationDto,
  CreateInterviewPreparationPlanDto,
  CreatePeerPracticeSessionDto,
  InterviewLoopTemplateDto,
  InterviewPreparationOverviewDto,
  InterviewPreparationPlanDto,
  PeerPracticeSessionDto,
  PeerPracticeStatus,
  PreparationRoundDto,
  PreparationTaskDto,
  ReadinessSnapshotDto,
  ReschedulePeerPracticeSessionDto,
  SubmitPeerScorecardDto,
  UpdateInterviewPreparationPlanDto,
  UpdatePreparationRoundDto,
} from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from './toast.store';

const ENDPOINT = '/api/v1/interview-preparation';

interface InterviewReadinessState {
  overview: InterviewPreparationOverviewDto | null;
  plan: InterviewPreparationPlanDto | null;
  peerSession: PeerPracticeSessionDto | null;
  templates: InterviewLoopTemplateDto[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadOverview: () => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadPlan: (planId: string) => Promise<void>;
  loadPeerSession: (sessionId: string) => Promise<void>;
  createPlan: (input: CreateInterviewPreparationPlanDto) => Promise<string | null>;
  updatePlan: (planId: string, input: UpdateInterviewPreparationPlanDto) => Promise<boolean>;
  updateRound: (roundId: string, input: UpdatePreparationRoundDto) => Promise<boolean>;
  setTaskCompletion: (task: PreparationTaskDto, completed: boolean) => Promise<void>;
  refreshSnapshot: (planId: string) => Promise<ReadinessSnapshotDto | null>;
  createPeerSession: (planId: string, input: CreatePeerPracticeSessionDto) => Promise<boolean>;
  updatePeerSessionStatus: (
    session: PeerPracticeSessionDto,
    status: Exclude<PeerPracticeStatus, 'PENDING'>,
  ) => Promise<boolean>;
  reschedulePeerSession: (
    session: PeerPracticeSessionDto,
    input: Omit<ReschedulePeerPracticeSessionDto, 'version'>,
  ) => Promise<boolean>;
  submitPeerScorecard: (
    sessionId: string,
    input: SubmitPeerScorecardDto,
  ) => Promise<boolean>;
  generateExplanation: (
    planId: string,
    snapshotId: string,
  ) => Promise<AiReadinessExplanationDto | null>;
  clearPlan: () => void;
}

function messageFor(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
}

function replaceTask(
  plan: InterviewPreparationPlanDto,
  task: PreparationTaskDto,
): InterviewPreparationPlanDto {
  return {
    ...plan,
    rounds: plan.rounds.map((round) => ({
      ...round,
      tasks: round.tasks.map((item) => (item.id === task.id ? task : item)),
    })),
  };
}

function replacePeerSession(
  plan: InterviewPreparationPlanDto,
  session: PeerPracticeSessionDto,
): InterviewPreparationPlanDto {
  const exists = plan.peerSessions.some((item) => item.id === session.id);
  return {
    ...plan,
    peerSessions: exists
      ? plan.peerSessions.map((item) => (item.id === session.id ? session : item))
      : [...plan.peerSessions, session].sort(
          (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        ),
  };
}

export const useInterviewReadinessStore = create<InterviewReadinessState>((set, get) => ({
  overview: null,
  plan: null,
  peerSession: null,
  templates: [],
  isLoading: false,
  isSaving: false,
  error: null,

  loadOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<InterviewPreparationOverviewDto>(`${ENDPOINT}/overview`);
      await api.post(`${ENDPOINT}/reminders/sync`).catch(() => undefined);
      set({ overview: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: messageFor(error, 'Could not load interview preparation.') });
    }
  },

  loadTemplates: async () => {
    if (get().templates.length > 0) return;
    try {
      const response = await api.get<InterviewLoopTemplateDto[]>(`${ENDPOINT}/templates`);
      set({ templates: response.data });
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not load interview templates.'), 'error');
    }
  },

  loadPlan: async (planId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<InterviewPreparationPlanDto>(`${ENDPOINT}/plans/${planId}`);
      set({ plan: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: messageFor(error, 'Could not load this preparation plan.') });
    }
  },

  loadPeerSession: async (sessionId) => {
    set({ isLoading: true, error: null, peerSession: null });
    try {
      const response = await api.get<PeerPracticeSessionDto>(`${ENDPOINT}/peer-sessions/${sessionId}`);
      set({ peerSession: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: messageFor(error, 'Could not load this peer session.') });
    }
  },

  createPlan: async (input) => {
    set({ isSaving: true });
    try {
      await api.post(`${ENDPOINT}/plans/preview`, input);
      const response = await api.post<InterviewPreparationPlanDto>(`${ENDPOINT}/plans`, input);
      set({ plan: response.data, isSaving: false });
      useToastStore.getState().addToast('Preparation plan created.', 'success');
      return response.data.id;
    } catch (error) {
      set({ isSaving: false });
      useToastStore.getState().addToast(messageFor(error, 'Could not create the preparation plan.'), 'error');
      return null;
    }
  },

  updatePlan: async (planId, input) => {
    set({ isSaving: true });
    try {
      const response = await api.patch<InterviewPreparationPlanDto>(`${ENDPOINT}/plans/${planId}`, input);
      set({ plan: response.data, isSaving: false });
      useToastStore.getState().addToast('Plan settings updated.', 'success');
      return true;
    } catch (error) {
      set({ isSaving: false });
      useToastStore.getState().addToast(messageFor(error, 'Could not update plan settings.'), 'error');
      return false;
    }
  },

  updateRound: async (roundId, input) => {
    const current = get().plan;
    if (!current) return false;
    set({ isSaving: true });
    try {
      const response = await api.patch<PreparationRoundDto>(`${ENDPOINT}/rounds/${roundId}`, input);
      set({
        isSaving: false,
        plan: {
          ...current,
          rounds: current.rounds
            .map((round) =>
              round.id === roundId
                ? { ...response.data, tasks: round.tasks, readiness: round.readiness }
                : round,
            )
            .sort((a, b) => a.ordinal - b.ordinal),
        },
      });
      return true;
    } catch (error) {
      set({ isSaving: false });
      useToastStore.getState().addToast(messageFor(error, 'Could not update the interview round.'), 'error');
      return false;
    }
  },

  setTaskCompletion: async (task, completed) => {
    const current = get().plan;
    if (!current) return;
    const optimistic: PreparationTaskDto = {
      ...task,
      status: completed ? 'COMPLETED' : 'PENDING',
      completedAt: completed ? new Date().toISOString() : null,
      version: task.version + 1,
    };
    set({ plan: replaceTask(current, optimistic) });
    try {
      const action = completed ? 'complete' : 'reopen';
      const response = await api.post<PreparationTaskDto>(`${ENDPOINT}/tasks/${task.id}/${action}`, {
        version: task.version,
      });
      const latest = get().plan;
      if (latest) set({ plan: replaceTask(latest, response.data) });
      await get().refreshSnapshot(current.id);
    } catch (error) {
      set({ plan: current });
      useToastStore.getState().addToast(messageFor(error, 'Could not update the task.'), 'error');
    }
  },

  refreshSnapshot: async (planId) => {
    try {
      const response = await api.post<ReadinessSnapshotDto>(
        `${ENDPOINT}/plans/${planId}/readiness-snapshots`,
      );
      const current = get().plan;
      if (current?.id === planId) {
        const readinessByRound = new Map(response.data.rounds.map((round) => [round.roundId, round]));
        set({
          plan: {
            ...current,
            latestReadiness: response.data,
            snapshots: [response.data, ...current.snapshots.filter((item) => item.id !== response.data.id)],
            rounds: current.rounds.map((round) => ({
              ...round,
              readiness: readinessByRound.get(round.id) ?? round.readiness,
            })),
          },
        });
      }
      return response.data;
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not refresh readiness evidence.'), 'error');
      return null;
    }
  },

  createPeerSession: async (planId, input) => {
    set({ isSaving: true });
    try {
      const response = await api.post<PeerPracticeSessionDto>(`${ENDPOINT}/plans/${planId}/peer-sessions`, input);
      const current = get().plan;
      set({ plan: current ? replacePeerSession(current, response.data) : current, isSaving: false });
      useToastStore.getState().addToast('Peer practice invitation sent.', 'success');
      return true;
    } catch (error) {
      set({ isSaving: false });
      useToastStore.getState().addToast(messageFor(error, 'Could not schedule peer practice.'), 'error');
      return false;
    }
  },

  updatePeerSessionStatus: async (session, status) => {
    try {
      const response = await api.patch<PeerPracticeSessionDto>(`${ENDPOINT}/peer-sessions/${session.id}/status`, {
        status,
        version: session.version,
      });
      const current = get().plan;
      set({
        plan: current ? replacePeerSession(current, response.data) : current,
        peerSession: get().peerSession?.id === response.data.id ? response.data : get().peerSession,
      });
      return true;
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not update the peer session.'), 'error');
      return false;
    }
  },

  reschedulePeerSession: async (session, input) => {
    try {
      const response = await api.patch<PeerPracticeSessionDto>(`${ENDPOINT}/peer-sessions/${session.id}/reschedule`, {
        ...input,
        version: session.version,
      });
      const current = get().plan;
      set({
        plan: current ? replacePeerSession(current, response.data) : current,
        peerSession: get().peerSession?.id === response.data.id ? response.data : get().peerSession,
      });
      useToastStore.getState().addToast('Peer practice rescheduled.', 'success');
      return true;
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not reschedule peer practice.'), 'error');
      return false;
    }
  },

  submitPeerScorecard: async (sessionId, input) => {
    try {
      await api.post(`${ENDPOINT}/peer-sessions/${sessionId}/scorecards`, input);
      const current = get().plan;
      const peerSession = get().peerSession;
      if (current) await get().loadPlan(current.id);
      if (peerSession) await get().loadPeerSession(peerSession.id);
      useToastStore.getState().addToast('Peer feedback submitted.', 'success');
      return true;
    } catch (error) {
      useToastStore.getState().addToast(messageFor(error, 'Could not submit peer feedback.'), 'error');
      return false;
    }
  },

  generateExplanation: async (planId, snapshotId) => {
    set({ isSaving: true });
    try {
      const response = await api.post<AiReadinessExplanationDto>(
        `${ENDPOINT}/plans/${planId}/readiness-snapshots/${snapshotId}/explanation`,
      );
      const current = get().plan;
      if (current) {
        set({
          isSaving: false,
          plan: {
            ...current,
            snapshots: current.snapshots.map((snapshot) =>
              snapshot.id === snapshotId
                ? { ...snapshot, aiExplanation: response.data.explanation, aiSnapshotId: snapshotId }
                : snapshot,
            ),
          },
        });
      } else {
        set({ isSaving: false });
      }
      return response.data;
    } catch (error) {
      set({ isSaving: false });
      useToastStore.getState().addToast(messageFor(error, 'Could not generate the readiness explanation.'), 'error');
      return null;
    }
  },

  clearPlan: () => set({ plan: null, error: null }),
}));
