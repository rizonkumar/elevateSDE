import type { AdminForumPostDto, ForumCommentDto, ForumPostStatus } from '@elevatesde/shared-types';
import { api } from './api';

export interface ForumTag {
  id: string;
  label: string;
}

export const FORUM_TAGS: ForumTag[] = [
  { id: 'system-design', label: 'System Design' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'offers', label: 'Offers' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'faang', label: 'FAANG' },
  { id: 'startups', label: 'Startups' },
  { id: 'resume', label: 'Resume' },
];

export function getTagLabel(id: string): string {
  return FORUM_TAGS.find((tag) => tag.id === id)?.label ?? id;
}

export async function getModerationPosts(): Promise<AdminForumPostDto[]> {
  const { data } = await api.get<AdminForumPostDto[]>('/api/v1/admin/forum-posts');
  return data;
}

export async function getPostComments(postId: string): Promise<ForumCommentDto[]> {
  const { data } = await api.get<ForumCommentDto[]>(`/api/v1/admin/forum-posts/${postId}/comments`);
  return data;
}

export async function updatePostStatus(
  postId: string,
  status: ForumPostStatus,
): Promise<AdminForumPostDto> {
  const { data } = await api.patch<AdminForumPostDto>(
    `/api/v1/admin/forum-posts/${postId}/status`,
    { status },
  );
  return data;
}
