'use client';

import * as React from 'react';
import { ArrowLeft, MessageSquare, MessagesSquare, Plus } from 'lucide-react';
import { Button, Textarea } from '@elevatesde/ui';
import type {
  ProblemDiscussionCommentDto,
  ProblemDiscussionDto,
} from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { UpvoteButton } from '@/components/dashboard/forum/UpvoteButton';
import { CommentItem } from '@/components/dashboard/forum/CommentItem';
import { formatRelativeTime } from '@/lib/relative-time';
import { useProblemSocialStore } from '@/store/problem-social.store';
import { DiscussionComposer } from './DiscussionComposer';

const EMPTY_DISCUSSIONS: ProblemDiscussionDto[] = [];
const EMPTY_COMMENTS: ProblemDiscussionCommentDto[] = [];

interface DiscussionTabProps {
  problemId: string;
}

export function DiscussionTab({ problemId }: Readonly<DiscussionTabProps>) {
  const discussions = useProblemSocialStore(
    (state) => state.discussions[problemId] ?? EMPTY_DISCUSSIONS,
  );
  const isLoading = useProblemSocialStore((state) => state.isLoadingDiscussions);
  const fetchDiscussions = useProblemSocialStore((state) => state.fetchDiscussions);
  const fetchDiscussionComments = useProblemSocialStore(
    (state) => state.fetchDiscussionComments,
  );
  const addDiscussionComment = useProblemSocialStore((state) => state.addDiscussionComment);
  const toggleDiscussionUpvote = useProblemSocialStore((state) => state.toggleDiscussionUpvote);
  const toggleDiscussionCommentUpvote = useProblemSocialStore(
    (state) => state.toggleDiscussionCommentUpvote,
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [reply, setReply] = React.useState('');

  const comments = useProblemSocialStore((state) =>
    selectedId ? (state.discussionComments[selectedId] ?? EMPTY_COMMENTS) : EMPTY_COMMENTS,
  );

  React.useEffect(() => {
    if (useProblemSocialStore.getState().discussions[problemId] === undefined) {
      void fetchDiscussions(problemId);
    }
  }, [problemId, fetchDiscussions]);

  React.useEffect(() => {
    if (selectedId) {
      void fetchDiscussionComments(selectedId);
      setReply('');
    }
  }, [selectedId, fetchDiscussionComments]);

  const selected = selectedId
    ? (discussions.find((discussion) => discussion.id === selectedId) ?? null)
    : null;

  const handleReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !reply.trim()) {
      return;
    }
    void addDiscussionComment(problemId, selectedId, reply);
    setReply('');
  };

  if (selected) {
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-(--color-text-muted) transition-colors hover:text-(--color-text-primary) cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          All discussions
        </button>

        <article className="flex gap-4">
          <UpvoteButton
            count={selected.upvotes}
            active={selected.hasUpvoted}
            onToggle={() => toggleDiscussionUpvote(problemId, selected.id)}
          />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 font-display text-lg font-semibold tracking-tight text-(--color-text-primary)">
              {selected.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--color-text-muted)">
              <AuthorAvatar name={selected.author.name} size="sm" />
              <span className="font-medium text-(--color-text-primary)">
                {selected.author.name}
              </span>
              {selected.author.headline && <span>· {selected.author.headline}</span>}
              <span>· {formatRelativeTime(selected.createdAt)}</span>
            </div>
            <p className="mt-3 mb-0 whitespace-pre-wrap text-sm leading-relaxed text-(--color-text-primary)">
              {selected.body}
            </p>
          </div>
        </article>

        <section className="border-t border-(--color-border-subtle) pt-4">
          <h4 className="m-0 mb-3 text-sm font-semibold text-(--color-text-primary)">
            {comments.length} {comments.length === 1 ? 'reply' : 'replies'}
          </h4>
          <form className="flex flex-col gap-3" onSubmit={handleReply}>
            <Textarea
              placeholder="Add your reply."
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              rows={3}
              maxLength={4000}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!reply.trim()}>
                Post reply
              </Button>
            </div>
          </form>
          {comments.length > 0 && (
            <div className="mt-3 flex flex-col divide-y divide-(--color-border-subtle) border-t border-(--color-border-subtle) pt-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onUpvote={(commentId) => toggleDiscussionCommentUpvote(selected.id, commentId)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-(--color-text-muted)">
          {discussions.length} {discussions.length === 1 ? 'discussion' : 'discussions'}
        </span>
        <Button
          variant="secondary"
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {discussions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-(--radius-md) border border-dashed border-(--color-border-subtle) px-6 py-12 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--color-badge-bg) text-(--color-text-muted)">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <p className="m-0 text-sm text-(--color-text-muted)">
            {isLoading ? 'Loading discussions…' : 'No discussions yet. Start the conversation.'}
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {discussions.map((discussion) => (
            <li
              key={discussion.id}
              className="flex items-start gap-3 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3 transition-colors hover:border-(--color-accent)"
            >
              <UpvoteButton
                count={discussion.upvotes}
                active={discussion.hasUpvoted}
                onToggle={() => toggleDiscussionUpvote(problemId, discussion.id)}
                orientation="horizontal"
              />
              <button
                type="button"
                onClick={() => setSelectedId(discussion.id)}
                className="min-w-0 flex-1 text-left cursor-pointer"
              >
                <p className="m-0 truncate text-sm font-semibold text-(--color-text-primary)">
                  {discussion.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-(--color-text-muted)">
                  <span>{discussion.author.name}</span>
                  <span>· {formatRelativeTime(discussion.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    · <MessageSquare className="h-3 w-3" /> {discussion.replyCount}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DiscussionComposer
        problemId={problemId}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
    </div>
  );
}
