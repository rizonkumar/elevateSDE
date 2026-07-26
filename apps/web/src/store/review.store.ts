import { create } from 'zustand';
import type { ReviewItemDto, ReviewQuality, SubmissionHeatmapDto } from '@elevatesde/shared-types';
import { getSubmissionHeatmap } from '@/lib/profile-api';
import { getDueReviews, gradeReview } from '@/lib/review-api';
import { useToastStore } from '@/store/toast.store';

interface ReviewState {
  due: ReviewItemDto[];
  heatmap: SubmissionHeatmapDto | null;
  isLoading: boolean;
  hasLoaded: boolean;
  gradingProblemId: string | null;
  loadDue: () => Promise<void>;
  grade: (problemId: string, quality: ReviewQuality) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  due: [],
  heatmap: null,
  isLoading: false,
  hasLoaded: false,
  gradingProblemId: null,
  loadDue: async () => {
    set({ isLoading: true });
    try {
      const [due, heatmap] = await Promise.all([getDueReviews(), getSubmissionHeatmap()]);
      set({ due, heatmap, isLoading: false, hasLoaded: true });
    } catch {
      set({ isLoading: false, hasLoaded: true });
      useToastStore.getState().addToast('Could not load your review queue.', 'error');
    }
  },
  grade: async (problemId, quality) => {
    set({ gradingProblemId: problemId });
    try {
      await gradeReview(problemId, quality);
      const due = get().due.filter((item) => item.problem.id !== problemId);
      set({ due, gradingProblemId: null });
      useToastStore.getState().addToast('Review recorded.', 'success');
    } catch {
      set({ gradingProblemId: null });
      useToastStore.getState().addToast('Could not record your review.', 'error');
    }
  },
}));
