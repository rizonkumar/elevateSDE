'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Badge, Select } from '../../components/ui';
import type { BadgeVariant } from '../../components/ui';
import { useToastStore } from '../../store/toast.store';
import {
  getModerationPosts,
  getPostComments,
  getTagLabel,
  updatePostStatus,
} from '../../lib/forum-moderation-data';
import { formatRelativeTime, getNameInitials } from '../../lib/relative-time';
import { Button, ConfirmDialog, Input, Modal } from '@elevatesde/ui';
import type { AdminForumPostDto, ForumCommentDto, ForumPostStatus } from '@elevatesde/shared-types';
import { ArrowBigUp, Check, Eye, Flag, MessageSquare, Search, ShieldCheck } from 'lucide-react';

interface StatusFilterOption {
  value: string;
  label: string;
}

const STATUS_FILTERS: StatusFilterOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'REMOVED', label: 'Removed' },
];

const STATUS_VARIANT: Record<ForumPostStatus, BadgeVariant> = {
  PUBLISHED: 'success',
  FLAGGED: 'warning',
  REMOVED: 'danger',
};

const STATUS_LABEL: Record<ForumPostStatus, string> = {
  PUBLISHED: 'Published',
  FLAGGED: 'Flagged',
  REMOVED: 'Removed',
};

export default function ForumModerationPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [posts, setPosts] = React.useState<AdminForumPostDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const [selectedPost, setSelectedPost] = React.useState<AdminForumPostDto | null>(null);
  const [comments, setComments] = React.useState<ForumCommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<AdminForumPostDto | null>(null);

  const loadPosts = React.useCallback(async () => {
    try {
      const data = await getModerationPosts();
      setPosts(data);
    } catch {
      addToast('Failed to retrieve forum posts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openReview = async (post: AdminForumPostDto) => {
    setSelectedPost(post);
    setComments([]);
    setCommentsLoading(true);
    try {
      const thread = await getPostComments(post.id);
      setComments(thread);
    } catch {
      addToast('Failed to load the comment thread.', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeReview = () => {
    setSelectedPost(null);
    setComments([]);
  };

  const mergePost = (updated: AdminForumPostDto) => {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    setSelectedPost((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const changeStatus = async (
    post: AdminForumPostDto,
    status: ForumPostStatus,
    message: string,
  ) => {
    setUpdatingId(post.id);
    try {
      const updated = await updatePostStatus(post.id, status);
      mergePost(updated);
      addToast(message, 'success');
      return true;
    } catch {
      addToast('Could not update the post.', 'error');
      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = (post: AdminForumPostDto) =>
    changeStatus(post, 'PUBLISHED', 'Post approved and published.');

  const handleFlag = (post: AdminForumPostDto) =>
    changeStatus(post, 'FLAGGED', 'Post flagged for review.');

  const handleRemove = async () => {
    if (!removeTarget) return;
    const removed = await changeStatus(removeTarget, 'REMOVED', 'Post removed from the community.');
    if (removed) {
      setRemoveTarget(null);
      closeReview();
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const matched = posts.filter((post) => {
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      post.title.toLowerCase().includes(normalizedQuery) ||
      post.authorEmail.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-sm text-(--color-text-muted) animate-pulse">
            Retrieving community posts...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by title or author email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-(--color-text-muted)" />}
              />
            </div>
            <Select
              value={statusFilter}
              options={STATUS_FILTERS}
              onChange={setStatusFilter}
              className="sm:w-48"
            />
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-(--color-border-subtle) bg-(--color-bg-soft) text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                  <th className="px-6 py-4">Post</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Upvotes</th>
                  <th className="px-6 py-4 text-right">Replies</th>
                  <th className="px-6 py-4 text-right">Reports</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-subtle)">
                {matched.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-xs text-(--color-text-muted)"
                    >
                      No posts match the current filters.
                    </td>
                  </tr>
                ) : (
                  matched.map((post) => (
                    <tr key={post.id} className="hover:bg-(--color-bg-soft)/50 transition-colors">
                      <td className="px-6 py-4 max-w-md">
                        <div className="font-semibold text-(--color-text-primary) truncate">
                          {post.title}
                        </div>
                        <div className="text-xs text-(--color-text-muted) font-mono truncate">
                          {post.authorEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={STATUS_VARIANT[post.status]}
                          className="justify-center min-w-[84px]"
                        >
                          {STATUS_LABEL[post.status]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-(--color-text-primary)">
                        {post.upvotes}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-(--color-text-primary)">
                        {post.replyCount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            post.reportCount > 0
                              ? 'text-(--color-danger)'
                              : 'text-(--color-text-muted)'
                          }`}
                        >
                          {post.reportCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-(--color-text-muted)">
                        {formatRelativeTime(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button type="button" variant="secondary" onClick={() => openReview(post)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {matched.length === 0 ? (
              <div className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm px-6 py-10 text-center text-xs text-(--color-text-muted)">
                No posts match the current filters.
              </div>
            ) : (
              matched.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-(--color-border-subtle) bg-(--color-surface) shadow-sm p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-sm text-(--color-text-primary)">
                      {post.title}
                    </span>
                    <Badge variant={STATUS_VARIANT[post.status]}>{STATUS_LABEL[post.status]}</Badge>
                  </div>
                  <span className="text-xs text-(--color-text-muted) font-mono break-all">
                    {post.authorEmail}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-(--color-text-muted)">
                    <span className="inline-flex items-center gap-1">
                      <ArrowBigUp className="w-3.5 h-3.5 shrink-0" />
                      {post.upvotes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      {post.replyCount}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        post.reportCount > 0 ? 'text-(--color-danger)' : ''
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 shrink-0" />
                      {post.reportCount}
                    </span>
                    <span className="ml-auto">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => openReview(post)}
                    className="w-full"
                  >
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal
        open={selectedPost !== null}
        onClose={closeReview}
        title={selectedPost?.title ?? 'Review post'}
        description={
          selectedPost ? `${selectedPost.author.name} · ${selectedPost.authorEmail}` : undefined
        }
      >
        {selectedPost && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={STATUS_VARIANT[selectedPost.status]}>
                {STATUS_LABEL[selectedPost.status]}
              </Badge>
              {selectedPost.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {getTagLabel(tag)}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-(--color-text-muted)">
              <span className="inline-flex items-center gap-1.5">
                <ArrowBigUp className="w-4 h-4 shrink-0" />
                {selectedPost.upvotes.toLocaleString()} upvotes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 shrink-0" />
                {selectedPost.replyCount} replies
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-4 h-4 shrink-0" />
                {selectedPost.viewCount.toLocaleString()} views
              </span>
              <span className="ml-auto">{formatRelativeTime(selectedPost.createdAt)}</span>
            </div>

            <p className="text-sm leading-relaxed text-(--color-text-primary) whitespace-pre-line rounded-lg border border-(--color-border-subtle) bg-(--color-bg-soft) p-4">
              {selectedPost.body}
            </p>

            {selectedPost.reports.length > 0 && (
              <div className="rounded-lg border border-(--color-border-subtle) bg-(--color-bg-soft) p-4 flex flex-col gap-2">
                <span className="text-xs font-semibold text-(--color-danger) uppercase tracking-wider flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5 shrink-0" />
                  {selectedPost.reportCount} report{selectedPost.reportCount === 1 ? '' : 's'}
                </span>
                <ul className="flex flex-col gap-1.5">
                  {selectedPost.reports.map((report) => (
                    <li
                      key={report.id}
                      className="text-xs text-(--color-text-muted) flex items-center justify-between gap-3"
                    >
                      <span className="text-(--color-text-primary)">{report.reason}</span>
                      <span className="font-mono shrink-0">
                        {formatRelativeTime(report.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                Comment thread
              </span>
              {commentsLoading ? (
                <span className="text-xs text-(--color-text-muted) animate-pulse">
                  Loading comments...
                </span>
              ) : comments.length === 0 ? (
                <span className="text-xs text-(--color-text-muted)">No comments on this post.</span>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-(--color-badge-bg) text-(--color-text-muted) flex items-center justify-center text-[11px] font-semibold">
                      {getNameInitials(comment.author.name)}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-(--color-text-primary)">
                          {comment.author.name}
                        </span>
                        <span className="text-(--color-text-muted)">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-(--color-text-primary)">{comment.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 px-5 sm:px-6 py-4 bg-(--color-surface) border-t border-(--color-border-subtle) flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={updatingId === selectedPost.id || selectedPost.status === 'FLAGGED'}
                onClick={() => handleFlag(selectedPost)}
                className="inline-flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4 shrink-0" />
                {selectedPost.status === 'FLAGGED' ? 'Flagged' : 'Flag'}
              </Button>
              <Button
                type="button"
                disabled={updatingId === selectedPost.id || selectedPost.status === 'PUBLISHED'}
                onClick={() => handleApprove(selectedPost)}
                className="inline-flex items-center justify-center gap-2"
              >
                {selectedPost.status === 'PUBLISHED' ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    Approved
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={updatingId === selectedPost.id || selectedPost.status === 'REMOVED'}
                onClick={() => setRemoveTarget(selectedPost)}
              >
                {selectedPost.status === 'REMOVED' ? 'Removed' : 'Remove'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remove this post?"
        description="The post will be hidden from the community. This can be reverted by approving it again."
        tone="danger"
        confirmLabel="Remove post"
        loading={removeTarget !== null && updatingId === removeTarget.id}
        onConfirm={handleRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </AdminLayout>
  );
}
