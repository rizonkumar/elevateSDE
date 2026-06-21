import { create } from 'zustand';
import type { ForumCommentDto, ForumPostDto, ForumSortOption } from '@elevatesde/shared-types';
import { api } from '@/lib/api';
import { useToastStore } from '@/store/toast.store';

const PAGE_SIZE = 6;

export interface CreatePostInput {
  title: string;
  body: string;
  tags: string[];
}

export interface ForumFilters {
  sort: ForumSortOption;
  activeTag: string | null;
  query: string;
}

interface ForumState {
  posts: ForumPostDto[];
  comments: Record<string, ForumCommentDto[]>;
  sort: ForumSortOption;
  activeTag: string | null;
  query: string;
  visibleCount: number;
  isModalOpen: boolean;
  isLoading: boolean;
  setSort: (sort: ForumSortOption) => void;
  setTag: (tag: string | null) => void;
  setQuery: (query: string) => void;
  loadMore: () => void;
  fetchPosts: () => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<void>;
  togglePostUpvote: (id: string) => Promise<void>;
  toggleCommentUpvote: (postId: string, commentId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<void>;
  getPostById: (id: string) => ForumPostDto | undefined;
  getComments: (postId: string) => ForumCommentDto[];
  openModal: () => void;
  closeModal: () => void;
}

export function filterAndSortPosts(posts: ForumPostDto[], filters: ForumFilters): ForumPostDto[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const filtered = posts.filter((post) => {
    if (filters.activeTag && !post.tags.includes(filters.activeTag)) {
      return false;
    }
    if (filters.sort === 'unanswered' && post.replyCount > 0) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${post.title} ${post.body} ${post.author.name}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  if (filters.sort === 'popular') {
    sorted.sort((a, b) => b.upvotes - a.upvotes);
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sorted;
}

function upsertPost(posts: ForumPostDto[], next: ForumPostDto): ForumPostDto[] {
  const exists = posts.some((post) => post.id === next.id);
  return exists ? posts.map((post) => (post.id === next.id ? next : post)) : [next, ...posts];
}

function toggleVoteState<T extends { hasUpvoted: boolean; upvotes: number }>(item: T): T {
  return {
    ...item,
    hasUpvoted: !item.hasUpvoted,
    upvotes: item.upvotes + (item.hasUpvoted ? -1 : 1),
  };
}

export const useForumStore = create<ForumState>((set, get) => ({
  posts: [],
  comments: {},
  sort: 'newest',
  activeTag: null,
  query: '',
  visibleCount: PAGE_SIZE,
  isModalOpen: false,
  isLoading: false,

  setSort: (sort) => set({ sort, visibleCount: PAGE_SIZE }),
  setTag: (activeTag) => set({ activeTag, visibleCount: PAGE_SIZE }),
  setQuery: (query) => set({ query, visibleCount: PAGE_SIZE }),
  loadMore: () => set((state) => ({ visibleCount: state.visibleCount + PAGE_SIZE })),

  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<ForumPostDto[]>('/api/v1/forum/posts');
      set({ posts: data, isLoading: false });
    } catch {
      set({ isLoading: false });
      useToastStore.getState().addToast('Could not load discussions.', 'error');
    }
  },

  fetchPost: async (id) => {
    try {
      const { data } = await api.get<ForumPostDto>(`/api/v1/forum/posts/${id}`);
      set((state) => ({ posts: upsertPost(state.posts, data) }));
    } catch {
      set((state) => ({ posts: state.posts.filter((post) => post.id !== id) }));
    }
  },

  fetchComments: async (postId) => {
    try {
      const { data } = await api.get<ForumCommentDto[]>(`/api/v1/forum/posts/${postId}/comments`);
      set((state) => ({ comments: { ...state.comments, [postId]: data } }));
    } catch {
      useToastStore.getState().addToast('Could not load replies.', 'error');
    }
  },

  createPost: async (input) => {
    try {
      const { data } = await api.post<ForumPostDto>('/api/v1/forum/posts', input);
      set((state) => ({
        posts: [data, ...state.posts],
        isModalOpen: false,
        sort: 'newest',
        activeTag: null,
        query: '',
        visibleCount: PAGE_SIZE,
      }));
      useToastStore.getState().addToast('Your post is live.', 'success');
    } catch {
      useToastStore.getState().addToast('Could not publish your post.', 'error');
    }
  },

  togglePostUpvote: async (id) => {
    const previous = get().posts;
    set({ posts: previous.map((post) => (post.id === id ? toggleVoteState(post) : post)) });
    try {
      const { data } = await api.post<ForumPostDto>(`/api/v1/forum/posts/${id}/upvote`);
      set((state) => ({ posts: state.posts.map((post) => (post.id === id ? data : post)) }));
    } catch {
      set({ posts: previous });
      useToastStore.getState().addToast('Could not register your vote.', 'error');
    }
  },

  toggleCommentUpvote: async (postId, commentId) => {
    const previous = get().comments[postId];
    if (!previous) {
      return;
    }
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: previous.map((comment) =>
          comment.id === commentId ? toggleVoteState(comment) : comment,
        ),
      },
    }));
    try {
      const { data } = await api.post<ForumCommentDto>(
        `/api/v1/forum/comments/${commentId}/upvote`,
      );
      set((state) => ({
        comments: {
          ...state.comments,
          [postId]: (state.comments[postId] ?? []).map((comment) =>
            comment.id === commentId ? data : comment,
          ),
        },
      }));
    } catch {
      set((state) => ({ comments: { ...state.comments, [postId]: previous } }));
      useToastStore.getState().addToast('Could not register your vote.', 'error');
    }
  },

  addComment: async (postId, body) => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    try {
      const { data } = await api.post<ForumCommentDto>(`/api/v1/forum/posts/${postId}/comments`, {
        body: trimmed,
      });
      set((state) => ({
        comments: { ...state.comments, [postId]: [...(state.comments[postId] ?? []), data] },
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, replyCount: post.replyCount + 1 } : post,
        ),
      }));
      useToastStore.getState().addToast('Reply posted.', 'success');
    } catch {
      useToastStore.getState().addToast('Could not post your reply.', 'error');
    }
  },

  getPostById: (id) => get().posts.find((post) => post.id === id),
  getComments: (postId) => get().comments[postId] ?? [],

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
