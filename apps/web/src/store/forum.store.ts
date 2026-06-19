import { create } from 'zustand';
import type {
  ForumCommentDto,
  ForumPostDto,
  ForumSortOption,
} from '@elevatesde/shared-types';
import { FORUM_COMMENTS_SEED, FORUM_POSTS_SEED } from '@/lib/forum-data';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { getDisplayName } from '@/lib/user-display';

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
  setSort: (sort: ForumSortOption) => void;
  setTag: (tag: string | null) => void;
  setQuery: (query: string) => void;
  loadMore: () => void;
  createPost: (input: CreatePostInput) => void;
  togglePostUpvote: (id: string) => void;
  toggleCommentUpvote: (postId: string, commentId: string) => void;
  addComment: (postId: string, body: string) => void;
  getPostById: (id: string) => ForumPostDto | undefined;
  getComments: (postId: string) => ForumCommentDto[];
  openModal: () => void;
  closeModal: () => void;
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function currentAuthor() {
  const user = useAuthStore.getState().user;
  return {
    id: user?.id ?? 'u-you',
    name: user ? getDisplayName(user) : 'You',
    headline: user?.role ?? null,
  };
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

export const useForumStore = create<ForumState>((set, get) => ({
  posts: FORUM_POSTS_SEED,
  comments: FORUM_COMMENTS_SEED,
  sort: 'newest',
  activeTag: null,
  query: '',
  visibleCount: PAGE_SIZE,
  isModalOpen: false,

  setSort: (sort) => set({ sort, visibleCount: PAGE_SIZE }),
  setTag: (activeTag) => set({ activeTag, visibleCount: PAGE_SIZE }),
  setQuery: (query) => set({ query, visibleCount: PAGE_SIZE }),
  loadMore: () => set((state) => ({ visibleCount: state.visibleCount + PAGE_SIZE })),

  createPost: (input) => {
    const author = currentAuthor();
    const post: ForumPostDto = {
      id: makeId('post'),
      title: input.title.trim(),
      body: input.body.trim(),
      tags: input.tags,
      author,
      upvotes: 0,
      hasUpvoted: false,
      replyCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      posts: [post, ...state.posts],
      isModalOpen: false,
      sort: 'newest',
      activeTag: null,
      query: '',
      visibleCount: PAGE_SIZE,
    }));
    useToastStore.getState().addToast('Your post is live.', 'success');
  },

  togglePostUpvote: (id) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === id
          ? {
              ...post,
              hasUpvoted: !post.hasUpvoted,
              upvotes: post.upvotes + (post.hasUpvoted ? -1 : 1),
            }
          : post,
      ),
    })),

  toggleCommentUpvote: (postId, commentId) =>
    set((state) => {
      const list = state.comments[postId];
      if (!list) {
        return {};
      }
      return {
        comments: {
          ...state.comments,
          [postId]: list.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  hasUpvoted: !comment.hasUpvoted,
                  upvotes: comment.upvotes + (comment.hasUpvoted ? -1 : 1),
                }
              : comment,
          ),
        },
      };
    }),

  addComment: (postId, body) => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }
    const comment: ForumCommentDto = {
      id: makeId('c'),
      postId,
      author: currentAuthor(),
      body: trimmed,
      upvotes: 0,
      hasUpvoted: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      comments: {
        ...state.comments,
        [postId]: [...(state.comments[postId] ?? []), comment],
      },
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, replyCount: post.replyCount + 1 } : post,
      ),
    }));
    useToastStore.getState().addToast('Reply posted.', 'success');
  },

  getPostById: (id) => get().posts.find((post) => post.id === id),
  getComments: (postId) => get().comments[postId] ?? [],

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
