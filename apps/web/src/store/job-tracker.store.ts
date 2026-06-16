import { create } from 'zustand';
import type { JobApplicationDto, JobApplicationStatus } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

export interface JobApplicationInput {
  company: string;
  role: string;
  status: JobApplicationStatus;
  salaryRange: string | null;
  jobDescriptionUrl: string | null;
  interviewDate: string | null;
}

interface JobTrackerState {
  applications: JobApplicationDto[];
  isLoading: boolean;
  isModalOpen: boolean;
  editingId: string | null;
  load: () => Promise<void>;
  create: (input: JobApplicationInput) => Promise<boolean>;
  update: (id: string, input: JobApplicationInput) => Promise<boolean>;
  move: (id: string, toStatus: JobApplicationStatus, toIndex: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  openModal: (id?: string) => void;
  closeModal: () => void;
}

const ENDPOINT = '/api/v1/job-applications';

function toRequestBody(input: JobApplicationInput) {
  return {
    company: input.company,
    role: input.role,
    status: input.status,
    salaryRange: input.salaryRange ?? undefined,
    jobDescriptionUrl: input.jobDescriptionUrl ?? undefined,
    interviewDate: input.interviewDate ?? undefined,
  };
}

function reorder(
  applications: JobApplicationDto[],
  movingId: string,
  toStatus: JobApplicationStatus,
  toIndex: number,
): JobApplicationDto[] {
  const moving = applications.find((application) => application.id === movingId);
  if (!moving) {
    return applications;
  }
  const sourceStatus = moving.status;
  const destination = applications
    .filter((application) => application.status === toStatus && application.id !== movingId)
    .sort((a, b) => a.boardPosition - b.boardPosition);
  const clampedIndex = Math.max(0, Math.min(toIndex, destination.length));
  destination.splice(clampedIndex, 0, { ...moving, status: toStatus });

  const positionByStatus = new Map<string, number>();
  destination.forEach((application, index) => positionByStatus.set(application.id, index));

  if (sourceStatus !== toStatus) {
    applications
      .filter((application) => application.status === sourceStatus && application.id !== movingId)
      .sort((a, b) => a.boardPosition - b.boardPosition)
      .forEach((application, index) => positionByStatus.set(application.id, index));
  }

  return applications.map((application) => {
    if (application.id === movingId) {
      return {
        ...application,
        status: toStatus,
        boardPosition: positionByStatus.get(application.id) ?? application.boardPosition,
      };
    }
    if (positionByStatus.has(application.id)) {
      return { ...application, boardPosition: positionByStatus.get(application.id) ?? 0 };
    }
    return application;
  });
}

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  isLoading: false,
  isModalOpen: false,
  editingId: null,

  load: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<JobApplicationDto[]>(ENDPOINT);
      set({ applications: response.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      useToastStore.getState().addToast('Could not load your job applications.', 'error');
    }
  },

  create: async (input) => {
    try {
      const response = await api.post<JobApplicationDto>(ENDPOINT, toRequestBody(input));
      set((state) => ({ applications: [...state.applications, response.data] }));
      useToastStore.getState().addToast('Job application added.', 'success');
      return true;
    } catch {
      useToastStore.getState().addToast('Could not add the job application.', 'error');
      return false;
    }
  },

  update: async (id, input) => {
    try {
      const response = await api.patch<JobApplicationDto>(`${ENDPOINT}/${id}`, toRequestBody(input));
      set((state) => ({
        applications: state.applications.map((application) =>
          application.id === id ? response.data : application,
        ),
      }));
      useToastStore.getState().addToast('Job application updated.', 'success');
      return true;
    } catch {
      useToastStore.getState().addToast('Could not update the job application.', 'error');
      return false;
    }
  },

  move: async (id, toStatus, toIndex) => {
    const previous = get().applications;
    const next = reorder(previous, id, toStatus, toIndex);
    if (next === previous) {
      return;
    }
    set({ applications: next });
    const changed = next.filter((application) => {
      const before = previous.find((item) => item.id === application.id);
      return (
        !before ||
        before.status !== application.status ||
        before.boardPosition !== application.boardPosition
      );
    });
    try {
      await Promise.all(
        changed.map((application) =>
          api.patch(`${ENDPOINT}/${application.id}`, {
            status: application.status,
            boardPosition: application.boardPosition,
          }),
        ),
      );
    } catch {
      set({ applications: previous });
      useToastStore.getState().addToast('Could not move the application.', 'error');
    }
  },

  remove: async (id) => {
    const previous = get().applications;
    set({ applications: previous.filter((application) => application.id !== id) });
    try {
      await api.delete(`${ENDPOINT}/${id}`);
      useToastStore.getState().addToast('Job application removed.', 'success');
    } catch {
      set({ applications: previous });
      useToastStore.getState().addToast('Could not remove the job application.', 'error');
    }
  },

  openModal: (id) => set({ isModalOpen: true, editingId: id ?? null }),
  closeModal: () => set({ isModalOpen: false, editingId: null }),
}));
