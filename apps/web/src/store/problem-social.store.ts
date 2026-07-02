import { create } from 'zustand';
import type {
  BookmarkDto,
  BookmarkToggleDto,
  ProblemCollectionDto,
  ProblemCollectionItemDto,
  ProblemDiscussionCommentDto,
  ProblemDiscussionDto,
  ProblemNoteDto,
} from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';
import { toggleVoteState } from '@/store/forum.store';

export interface CreateDiscussionInput {
  title: string;
  body: string;
}

interface ProblemSocialState {
  discussions: Record<string, ProblemDiscussionDto[]>;
  discussionComments: Record<string, ProblemDiscussionCommentDto[]>;
  notes: Record<string, ProblemNoteDto | null>;
  bookmarkedProblemIds: Record<string, boolean>;
  bookmarks: BookmarkDto[];
  lists: ProblemCollectionDto[];
  isLoadingDiscussions: boolean;
  isLoadingComments: boolean;
  isSavingNote: boolean;
  isLoadingLists: boolean;
  hasLoadedLists: boolean;
  hasLoadedBookmarks: boolean;
  fetchDiscussions: (problemId: string) => Promise<void>;
  createDiscussion: (problemId: string, input: CreateDiscussionInput) => Promise<boolean>;
  fetchDiscussionComments: (discussionId: string) => Promise<void>;
  addDiscussionComment: (problemId: string, discussionId: string, body: string) => Promise<void>;
  toggleDiscussionUpvote: (problemId: string, discussionId: string) => Promise<void>;
  toggleDiscussionCommentUpvote: (discussionId: string, commentId: string) => Promise<void>;
  fetchNote: (problemId: string) => Promise<void>;
  saveNote: (problemId: string, body: string) => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  fetchBookmarkState: (problemId: string) => Promise<void>;
  toggleBookmark: (problemId: string) => Promise<void>;
  fetchLists: () => Promise<void>;
  createList: (name: string) => Promise<ProblemCollectionDto | null>;
  renameList: (listId: string, name: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addProblemToList: (listId: string, problemId: string) => Promise<void>;
  removeProblemFromList: (listId: string, problemId: string) => Promise<void>;
  reorderList: (listId: string, orderedProblemIds: string[]) => Promise<void>;
}

function bookmarkMap(bookmarks: BookmarkDto[]): Record<string, boolean> {
  return bookmarks.reduce<Record<string, boolean>>((acc, bookmark) => {
    acc[bookmark.problem.id] = true;
    return acc;
  }, {});
}

function reorderItems(
  items: ProblemCollectionItemDto[],
  orderedProblemIds: string[],
): ProblemCollectionItemDto[] {
  const byProblemId = new Map(items.map((item) => [item.problem.id, item]));
  return orderedProblemIds.reduce<ProblemCollectionItemDto[]>((acc, problemId, index) => {
    const item = byProblemId.get(problemId);
    if (item) {
      acc.push({ ...item, ordinal: index });
    }
    return acc;
  }, []);
}

export const useProblemSocialStore = create<ProblemSocialState>((set, get) => ({
  discussions: {},
  discussionComments: {},
  notes: {},
  bookmarkedProblemIds: {},
  bookmarks: [],
  lists: [],
  isLoadingDiscussions: false,
  isLoadingComments: false,
  isSavingNote: false,
  isLoadingLists: false,
  hasLoadedLists: false,
  hasLoadedBookmarks: false,

  fetchDiscussions: async (problemId) => {
    set({ isLoadingDiscussions: true });
    try {
      const { data } = await api.get<ProblemDiscussionDto[]>(
        `/api/v1/problems/${problemId}/discussions`,
      );
      set((state) => ({
        discussions: { ...state.discussions, [problemId]: data },
        isLoadingDiscussions: false,
      }));
    } catch {
      set({ isLoadingDiscussions: false });
      useToastStore.getState().addToast('Could not load discussions.', 'error');
    }
  },

  createDiscussion: async (problemId, input) => {
    try {
      const { data } = await api.post<ProblemDiscussionDto>(
        `/api/v1/problems/${problemId}/discussions`,
        input,
      );
      set((state) => ({
        discussions: {
          ...state.discussions,
          [problemId]: [data, ...(state.discussions[problemId] ?? [])],
        },
      }));
      useToastStore.getState().addToast('Discussion posted.', 'success');
      return true;
    } catch {
      useToastStore.getState().addToast('Could not post your discussion.', 'error');
      return false;
    }
  },

  fetchDiscussionComments: async (discussionId) => {
    set({ isLoadingComments: true });
    try {
      const { data } = await api.get<ProblemDiscussionCommentDto[]>(
        `/api/v1/discussions/${discussionId}/comments`,
      );
      set((state) => ({
        discussionComments: { ...state.discussionComments, [discussionId]: data },
        isLoadingComments: false,
      }));
    } catch {
      set({ isLoadingComments: false });
      useToastStore.getState().addToast('Could not load replies.', 'error');
    }
  },

  addDiscussionComment: async (problemId, discussionId, body) => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    try {
      const { data } = await api.post<ProblemDiscussionCommentDto>(
        `/api/v1/discussions/${discussionId}/comments`,
        { body: trimmed },
      );
      set((state) => ({
        discussionComments: {
          ...state.discussionComments,
          [discussionId]: [...(state.discussionComments[discussionId] ?? []), data],
        },
        discussions: {
          ...state.discussions,
          [problemId]: (state.discussions[problemId] ?? []).map((discussion) =>
            discussion.id === discussionId
              ? { ...discussion, replyCount: discussion.replyCount + 1 }
              : discussion,
          ),
        },
      }));
      useToastStore.getState().addToast('Reply posted.', 'success');
    } catch {
      useToastStore.getState().addToast('Could not post your reply.', 'error');
    }
  },

  toggleDiscussionUpvote: async (problemId, discussionId) => {
    const previous = get().discussions[problemId];
    if (!previous) {
      return;
    }
    set((state) => ({
      discussions: {
        ...state.discussions,
        [problemId]: previous.map((discussion) =>
          discussion.id === discussionId ? toggleVoteState(discussion) : discussion,
        ),
      },
    }));
    try {
      const { data } = await api.post<ProblemDiscussionDto>(
        `/api/v1/discussions/${discussionId}/upvote`,
      );
      set((state) => ({
        discussions: {
          ...state.discussions,
          [problemId]: (state.discussions[problemId] ?? []).map((discussion) =>
            discussion.id === discussionId ? data : discussion,
          ),
        },
      }));
    } catch {
      set((state) => ({ discussions: { ...state.discussions, [problemId]: previous } }));
      useToastStore.getState().addToast('Could not register your vote.', 'error');
    }
  },

  toggleDiscussionCommentUpvote: async (discussionId, commentId) => {
    const previous = get().discussionComments[discussionId];
    if (!previous) {
      return;
    }
    set((state) => ({
      discussionComments: {
        ...state.discussionComments,
        [discussionId]: previous.map((comment) =>
          comment.id === commentId ? toggleVoteState(comment) : comment,
        ),
      },
    }));
    try {
      const { data } = await api.post<ProblemDiscussionCommentDto>(
        `/api/v1/discussions/comments/${commentId}/upvote`,
      );
      set((state) => ({
        discussionComments: {
          ...state.discussionComments,
          [discussionId]: (state.discussionComments[discussionId] ?? []).map((comment) =>
            comment.id === commentId ? data : comment,
          ),
        },
      }));
    } catch {
      set((state) => ({
        discussionComments: { ...state.discussionComments, [discussionId]: previous },
      }));
      useToastStore.getState().addToast('Could not register your vote.', 'error');
    }
  },

  fetchNote: async (problemId) => {
    try {
      const { data } = await api.get<ProblemNoteDto>(`/api/v1/problems/${problemId}/note`);
      set((state) => ({ notes: { ...state.notes, [problemId]: data } }));
    } catch {
      set((state) => ({ notes: { ...state.notes, [problemId]: null } }));
    }
  },

  saveNote: async (problemId, body) => {
    set({ isSavingNote: true });
    try {
      const { data } = await api.put<ProblemNoteDto>(`/api/v1/problems/${problemId}/note`, {
        body,
      });
      set((state) => ({ notes: { ...state.notes, [problemId]: data }, isSavingNote: false }));
    } catch {
      set({ isSavingNote: false });
      useToastStore.getState().addToast('Could not save your note.', 'error');
    }
  },

  fetchBookmarks: async () => {
    try {
      const { data } = await api.get<BookmarkDto[]>('/api/v1/me/bookmarks');
      set({ bookmarks: data, bookmarkedProblemIds: bookmarkMap(data), hasLoadedBookmarks: true });
    } catch {
      useToastStore.getState().addToast('Could not load bookmarks.', 'error');
    }
  },

  fetchBookmarkState: async (problemId) => {
    try {
      const { data } = await api.get<BookmarkDto[]>('/api/v1/me/bookmarks');
      set({ bookmarks: data, bookmarkedProblemIds: bookmarkMap(data), hasLoadedBookmarks: true });
    } catch {
      set((state) => ({
        bookmarkedProblemIds: {
          ...state.bookmarkedProblemIds,
          [problemId]: state.bookmarkedProblemIds[problemId] ?? false,
        },
      }));
    }
  },

  toggleBookmark: async (problemId) => {
    const previous = get().bookmarkedProblemIds[problemId] ?? false;
    set((state) => ({
      bookmarkedProblemIds: { ...state.bookmarkedProblemIds, [problemId]: !previous },
    }));
    try {
      const { data } = await api.post<BookmarkToggleDto>(`/api/v1/problems/${problemId}/bookmark`);
      set((state) => ({
        bookmarkedProblemIds: { ...state.bookmarkedProblemIds, [problemId]: data.bookmarked },
        bookmarks: data.bookmarked
          ? state.bookmarks
          : state.bookmarks.filter((bookmark) => bookmark.problem.id !== problemId),
      }));
    } catch {
      set((state) => ({
        bookmarkedProblemIds: { ...state.bookmarkedProblemIds, [problemId]: previous },
      }));
      useToastStore.getState().addToast('Could not update bookmark.', 'error');
    }
  },

  fetchLists: async () => {
    set({ isLoadingLists: true });
    try {
      const { data } = await api.get<ProblemCollectionDto[]>('/api/v1/me/lists');
      set({ lists: data, isLoadingLists: false, hasLoadedLists: true });
    } catch {
      set({ isLoadingLists: false });
      useToastStore.getState().addToast('Could not load your lists.', 'error');
    }
  },

  createList: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const { data } = await api.post<ProblemCollectionDto>('/api/v1/me/lists', { name: trimmed });
      set((state) => ({ lists: [...state.lists, data] }));
      useToastStore.getState().addToast('List created.', 'success');
      return data;
    } catch {
      useToastStore.getState().addToast('Could not create the list.', 'error');
      return null;
    }
  },

  renameList: async (listId, name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const previous = get().lists;
    set({
      lists: previous.map((list) => (list.id === listId ? { ...list, name: trimmed } : list)),
    });
    try {
      const { data } = await api.patch<ProblemCollectionDto>(`/api/v1/me/lists/${listId}`, {
        name: trimmed,
      });
      set((state) => ({ lists: state.lists.map((list) => (list.id === listId ? data : list)) }));
    } catch {
      set({ lists: previous });
      useToastStore.getState().addToast('Could not rename the list.', 'error');
    }
  },

  deleteList: async (listId) => {
    const previous = get().lists;
    set({ lists: previous.filter((list) => list.id !== listId) });
    try {
      await api.delete(`/api/v1/me/lists/${listId}`);
      useToastStore.getState().addToast('List deleted.', 'success');
    } catch {
      set({ lists: previous });
      useToastStore.getState().addToast('Could not delete the list.', 'error');
    }
  },

  addProblemToList: async (listId, problemId) => {
    try {
      const { data } = await api.post<ProblemCollectionDto>(`/api/v1/me/lists/${listId}/items`, {
        problemId,
      });
      set((state) => ({ lists: state.lists.map((list) => (list.id === listId ? data : list)) }));
      useToastStore.getState().addToast('Added to list.', 'success');
    } catch {
      useToastStore.getState().addToast('Could not add to the list.', 'error');
    }
  },

  removeProblemFromList: async (listId, problemId) => {
    const previous = get().lists;
    set({
      lists: previous.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter((item) => item.problem.id !== problemId),
              itemCount: Math.max(0, list.itemCount - 1),
            }
          : list,
      ),
    });
    try {
      const { data } = await api.delete<ProblemCollectionDto>(
        `/api/v1/me/lists/${listId}/items/${problemId}`,
      );
      set((state) => ({ lists: state.lists.map((list) => (list.id === listId ? data : list)) }));
    } catch {
      set({ lists: previous });
      useToastStore.getState().addToast('Could not remove the problem.', 'error');
    }
  },

  reorderList: async (listId, orderedProblemIds) => {
    const previous = get().lists;
    const target = previous.find((list) => list.id === listId);
    if (!target) {
      return;
    }
    set({
      lists: previous.map((list) =>
        list.id === listId ? { ...list, items: reorderItems(list.items, orderedProblemIds) } : list,
      ),
    });
    try {
      const { data } = await api.patch<ProblemCollectionDto>(
        `/api/v1/me/lists/${listId}/reorder`,
        { orderedProblemIds },
      );
      set((state) => ({ lists: state.lists.map((list) => (list.id === listId ? data : list)) }));
    } catch {
      set({ lists: previous });
      useToastStore.getState().addToast('Could not reorder the list.', 'error');
    }
  },
}));
