'use client';

import type { ForumCommentDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { UpvoteButton } from '@/components/dashboard/forum/UpvoteButton';
import { formatRelativeTime } from '@/lib/relative-time';

interface CommentItemProps {
  comment: ForumCommentDto;
  onUpvote: (commentId: string) => void;
}

export function CommentItem({ comment, onUpvote }: CommentItemProps) {
  return (
    <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <AuthorAvatar name={comment.author.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-(--color-text-muted)">
          <span className="font-semibold text-(--color-text-primary)">{comment.author.name}</span>
          {comment.author.headline && <span>· {comment.author.headline}</span>}
          <span>· {formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="mt-1.5 mb-0 text-sm text-(--color-text-primary)">{comment.body}</p>
        <div className="mt-2.5">
          <UpvoteButton
            count={comment.upvotes}
            active={comment.hasUpvoted}
            onToggle={() => onUpvote(comment.id)}
            orientation="horizontal"
          />
        </div>
      </div>
    </div>
  );
}
