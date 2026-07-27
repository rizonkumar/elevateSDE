import { create } from 'zustand';
import type {
  ReviewItemDto,
  ReviewQuality,
  ReviewSummaryDto,
  SubmissionHeatmapDto,
} from '@elevatesde/shared-types';
import { getSubmissionHeatmap } from '@/lib/profile-api';
import { getDueReviews, getReviewSummary, gradeReview } from '@/lib/review-api';
import { useToastStore } from '@/store/toast.store';

interface ReviewState {
  due: ReviewItemDto[];
  summary: ReviewSummaryDto | null;
  heatmap: SubmissionHeatmapDto | null;
  isLoading: boolean;
  hasLoaded: boolean;
  gradingProblemId: string | null;
  loadDue: () => Promise<void>;
  loadSummary: () => Promise<void>;
  grade: (problemId: string, quality: ReviewQuality) => Promise<void>;
}

function describeNextReview(intervalDays: number): string {
  if (intervalDays <= 1) {
    return 'Recorded — back again tomorrow.';
  }
  return `Recorded — back again in ${intervalDays} days.`;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  due: [],
  summary: null,
  heatmap: null,
  isLoading: false,
  hasLoaded: false,
  gradingProblemId: null,
  loadDue: async () => {
    set({ isLoading: true });
    try {
      const [due, summary, heatmap] = await Promise.all([
        getDueReviews(),
        getReviewSummary(),
        getSubmissionHeatmap(),
      ]);
      set({ due, summary, heatmap, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your review queue.', 'error');
    }
  },
  loadSummary: async () => {
    try {
      const summary = await getReviewSummary();
      set({ summary });
    } catch {
      set({ summary: null });
    }
  },
  grade: async (problemId, quality) => {
    set({ gradingProblemId: problemId });
    try {
      const graded = await gradeReview(problemId, quality);
      const due = get().due.filter((item) => item.problem.id !== problemId);
      set({ due, gradingProblemId: null });
      useToastStore.getState().addToast(describeNextReview(graded.intervalDays), 'success');
      await get().loadSummary();
    } catch {
      set({ gradingProblemId: null });
      useToastStore.getState().addToast('Could not record your review.', 'error');
      await get().loadDue();
    }
  },
}));
