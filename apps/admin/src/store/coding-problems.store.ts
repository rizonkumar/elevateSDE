import { create } from 'zustand';
import type {
  AdminCodingProblemDto,
  AssessmentDifficulty,
  AssessmentLanguage,
  AssessmentTestCase,
} from '@elevatesde/shared-types';
import { useToastStore } from './toast.store';

export type DifficultyFilter = AssessmentDifficulty | 'ALL';

export interface ProblemFormValues {
  title: string;
  difficulty: AssessmentDifficulty;
  timeLimitMinutes: number;
  tags: string[];
  description: string;
  starterCode: Record<AssessmentLanguage, string>;
  testCases: AssessmentTestCase[];
  isPublished: boolean;
}

interface CodingProblemsState {
  problems: AdminCodingProblemDto[];
  loading: boolean;
  search: string;
  difficultyFilter: DifficultyFilter;
  isModalOpen: boolean;
  editingId: string | null;
  pendingDeleteId: string | null;
  savingId: string | null;
  togglingId: string | null;
  deletingId: string | null;
  loadProblems: () => Promise<void>;
  setSearch: (search: string) => void;
  setDifficultyFilter: (difficulty: DifficultyFilter) => void;
  openCreate: () => void;
  openEdit: (id: string) => void;
  closeModal: () => void;
  createProblem: (values: ProblemFormValues) => Promise<void>;
  updateProblem: (id: string, values: ProblemFormValues) => Promise<void>;
  togglePublish: (id: string) => Promise<void>;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

const notify = (message: string, type: 'success' | 'error') =>
  useToastStore.getState().addToast(message, type);

const SEED_PROBLEMS: AdminCodingProblemDto[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'EASY',
    timeLimitMinutes: 30,
    tags: ['Array', 'Hash Map'],
    description: [
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.',
      '',
      'You may assume that each input has exactly one solution, and you may not use the same element twice.',
    ].join('\n'),
    constraints: ['2 <= nums.length <= 10^4', 'Exactly one valid answer exists.'],
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9.' },
    ],
    starterCode: {
      javascript: ['function twoSum(nums, target) {', '}'].join('\n'),
      python: ['def two_sum(nums, target):', '    pass'].join('\n'),
      cpp: ['vector<int> twoSum(vector<int>& nums, int target) {', '}'].join('\n'),
    },
    testCases: [
      { id: 'two-sum-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { id: 'two-sum-2', input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
      { id: 'two-sum-3', input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true },
    ],
    isPublished: true,
    createdAt: '2026-01-12T09:00:00.000Z',
    updatedAt: '2026-02-04T11:30:00.000Z',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'EASY',
    timeLimitMinutes: 25,
    tags: ['String', 'Stack'],
    description: [
      'Given a string `s` containing just the characters `()[]{}`, determine if the input string is valid.',
      '',
      'A string is valid when open brackets are closed by the same type of bracket and in the correct order.',
    ].join('\n'),
    constraints: ['1 <= s.length <= 10^4', 's consists only of the characters ()[]{}.'],
    examples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'Every bracket is closed correctly.' }],
    starterCode: {
      javascript: ['function isValid(s) {', '}'].join('\n'),
      python: ['def is_valid(s):', '    pass'].join('\n'),
      cpp: ['bool isValid(string s) {', '}'].join('\n'),
    },
    testCases: [
      { id: 'valid-parentheses-1', input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
      { id: 'valid-parentheses-2', input: '"(]"', expectedOutput: 'false', isHidden: true },
    ],
    isPublished: true,
    createdAt: '2026-01-18T14:20:00.000Z',
    updatedAt: '2026-01-18T14:20:00.000Z',
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'MEDIUM',
    timeLimitMinutes: 40,
    tags: ['Array', 'Sorting'],
    description: [
      'Given an array of `intervals` where `intervals[i] = [start, end]`, merge all overlapping intervals and return the non-overlapping intervals that cover all the input intervals.',
    ].join('\n'),
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2'],
    examples: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap.' },
    ],
    starterCode: {
      javascript: ['function merge(intervals) {', '}'].join('\n'),
      python: ['def merge(intervals):', '    pass'].join('\n'),
      cpp: ['vector<vector<int>> merge(vector<vector<int>>& intervals) {', '}'].join('\n'),
    },
    testCases: [
      { id: 'merge-intervals-1', input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false },
      { id: 'merge-intervals-2', input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: true },
    ],
    isPublished: true,
    createdAt: '2026-02-22T08:10:00.000Z',
    updatedAt: '2026-03-01T16:45:00.000Z',
  },
  {
    id: 'median-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'HARD',
    timeLimitMinutes: 50,
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    description: [
      'Given two sorted arrays `nums1` and `nums2`, return the median of the two sorted arrays.',
      '',
      'The overall run time complexity should be `O(log (m + n))`.',
    ].join('\n'),
    constraints: ['0 <= m, n <= 1000', '1 <= m + n <= 2000'],
    examples: [{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'The merged array is [1,2,3].' }],
    starterCode: {
      javascript: ['function findMedianSortedArrays(nums1, nums2) {', '}'].join('\n'),
      python: ['def find_median_sorted_arrays(nums1, nums2):', '    pass'].join('\n'),
      cpp: ['double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {', '}'].join('\n'),
    },
    testCases: [
      { id: 'median-two-sorted-arrays-1', input: '[1,3], [2]', expectedOutput: '2.0', isHidden: false },
      { id: 'median-two-sorted-arrays-2', input: '[1,2], [3,4]', expectedOutput: '2.5', isHidden: true },
    ],
    isPublished: false,
    createdAt: '2026-03-15T10:05:00.000Z',
    updatedAt: '2026-03-15T10:05:00.000Z',
  },
];

export const useCodingProblemsStore = create<CodingProblemsState>((set, get) => ({
  problems: [],
  loading: true,
  search: '',
  difficultyFilter: 'ALL',
  isModalOpen: false,
  editingId: null,
  pendingDeleteId: null,
  savingId: null,
  togglingId: null,
  deletingId: null,

  loadProblems: async () => {
    set({ loading: true });
    try {
      set({ problems: SEED_PROBLEMS, loading: false });
    } catch {
      set({ loading: false });
      notify('Failed to retrieve coding problems.', 'error');
    }
  },

  setSearch: (search) => set({ search }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),

  openCreate: () => set({ isModalOpen: true, editingId: null }),
  openEdit: (id) => set({ isModalOpen: true, editingId: id }),
  closeModal: () => set({ isModalOpen: false, editingId: null }),

  createProblem: async (values) => {
    set({ savingId: 'new' });
    try {
      const now = new Date().toISOString();
      const problem: AdminCodingProblemDto = {
        id: crypto.randomUUID(),
        ...values,
        constraints: [],
        examples: [],
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        problems: [problem, ...state.problems],
        savingId: null,
        isModalOpen: false,
        editingId: null,
      }));
      notify('Coding problem created.', 'success');
    } catch {
      set({ savingId: null });
      notify('Failed to create coding problem.', 'error');
    }
  },

  updateProblem: async (id, values) => {
    set({ savingId: id });
    try {
      const now = new Date().toISOString();
      set((state) => ({
        problems: state.problems.map((problem) =>
          problem.id === id ? { ...problem, ...values, updatedAt: now } : problem,
        ),
        savingId: null,
        isModalOpen: false,
        editingId: null,
      }));
      notify('Coding problem updated.', 'success');
    } catch {
      set({ savingId: null });
      notify('Failed to update coding problem.', 'error');
    }
  },

  togglePublish: async (id) => {
    set({ togglingId: id });
    try {
      const target = get().problems.find((problem) => problem.id === id);
      const nextPublished = !target?.isPublished;
      const now = new Date().toISOString();
      set((state) => ({
        problems: state.problems.map((problem) =>
          problem.id === id ? { ...problem, isPublished: nextPublished, updatedAt: now } : problem,
        ),
        togglingId: null,
      }));
      notify(nextPublished ? 'Problem published.' : 'Problem unpublished.', 'success');
    } catch {
      set({ togglingId: null });
      notify('Failed to update publish state.', 'error');
    }
  },

  requestDelete: (id) => set({ pendingDeleteId: id }),
  cancelDelete: () => set({ pendingDeleteId: null }),

  confirmDelete: async () => {
    const id = get().pendingDeleteId;
    if (!id) {
      return;
    }
    set({ deletingId: id });
    try {
      set((state) => ({
        problems: state.problems.filter((problem) => problem.id !== id),
        deletingId: null,
        pendingDeleteId: null,
      }));
      notify('Coding problem deleted.', 'success');
    } catch {
      set({ deletingId: null });
      notify('Failed to delete coding problem.', 'error');
    }
  },
}));
