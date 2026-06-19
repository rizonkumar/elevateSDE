'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button, Badge, Textarea } from '@elevatesde/ui';
import type { ForumCommentDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { UpvoteButton } from '@/components/dashboard/forum/UpvoteButton';
import { CommentItem } from '@/components/dashboard/forum/CommentItem';
import { useForumStore } from '@/store/forum.store';
import { getTagLabel } from '@/lib/forum-data';
import { formatRelativeTime } from '@/lib/relative-time';

const EMPTY_COMMENTS: ForumCommentDto[] = [];

export default function ForumPostPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const post = useForumStore((state) => (id ? state.posts.find((item) => item.id === id) : undefined));
  const comments = useForumStore((state) => (id ? (state.comments[id] ?? EMPTY_COMMENTS) : EMPTY_COMMENTS));
  const togglePostUpvote = useForumStore((state) => state.togglePostUpvote);
  const toggleCommentUpvote = useForumStore((state) => state.toggleCommentUpvote);
  const addComment = useForumStore((state) => state.addComment);

  const [reply, setReply] = React.useState('');

  const handleReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !reply.trim()) {
      return;
    }
    addComment(id, reply);
    setReply('');
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard/forum"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to forum
        </Link>

        {post ? (
          <>
            <article className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
              <div className="flex gap-4">
                <UpvoteButton
                  count={post.upvotes}
                  active={post.hasUpvoted}
                  onToggle={() => togglePostUpvote(post.id)}
                />
                <div className="min-w-0 flex-1">
                  <h1 className="m-0 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {post.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-(--color-text-muted)">
                    <span className="inline-flex items-center gap-2">
                      <AuthorAvatar name={post.author.name} size="sm" />
                      <span className="font-medium text-(--color-text-primary)">
                        {post.author.name}
                      </span>
                      {post.author.headline && <span>· {post.author.headline}</span>}
                    </span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {post.viewCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-4 mb-0 whitespace-pre-wrap text-sm leading-relaxed text-(--color-text-primary)">
                    {post.body}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="neutral">
                          {getTagLabel(tag)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>

            <section className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-5 sm:p-6">
              <h2 className="m-0 mb-4 text-sm font-semibold text-(--color-text-primary)">
                {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
              </h2>
              <form className="flex flex-col gap-3" onSubmit={handleReply}>
                <Textarea
                  placeholder="Share your perspective or answer the question."
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!reply.trim()}>
                    Post reply
                  </Button>
                </div>
              </form>

              {comments.length > 0 && (
                <div className="mt-4 flex flex-col divide-y divide-(--color-border-subtle) border-t border-(--color-border-subtle) pt-2">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onUpvote={(commentId) => toggleCommentUpvote(post.id, commentId)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-(--color-border-subtle) bg-(--color-surface) px-6 py-16 text-center">
            <p className="m-0 text-sm text-(--color-text-muted)">This discussion is no longer available.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
