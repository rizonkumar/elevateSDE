'use client';

import Link from 'next/link';
import { MessageSquare, Eye } from 'lucide-react';
import { Badge } from '@elevatesde/ui';
import type { ForumPostDto } from '@elevatesde/shared-types';
import { AuthorAvatar } from '@/components/dashboard/AuthorAvatar';
import { UpvoteButton } from '@/components/dashboard/forum/UpvoteButton';
import { getTagLabel } from '@/lib/forum-data';
import { formatRelativeTime } from '@/lib/relative-time';

interface PostCardProps {
  post: ForumPostDto;
  onUpvote: (id: string) => void;
}

export function PostCard({ post, onUpvote }: PostCardProps) {
  return (
    <article className="rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card) p-4 transition-colors hover:border-(--color-accent) sm:p-5">
      <div className="flex gap-4">
        <UpvoteButton
          count={post.upvotes}
          active={post.hasUpvoted}
          onToggle={() => onUpvote(post.id)}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/forum/${post.id}`}
            className="block focus:outline-none focus-visible:underline"
          >
            <h3 className="m-0 text-base font-semibold tracking-tight text-(--color-text-primary)">
              {post.title}
            </h3>
            <p className="mt-1.5 mb-0 line-clamp-2 text-sm text-(--color-text-muted)">
              {post.body}
            </p>
          </Link>
          {post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {getTagLabel(tag)}
                </Badge>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-(--color-text-muted)">
            <span className="inline-flex items-center gap-2">
              <AuthorAvatar name={post.author.name} size="sm" />
              <span className="font-medium text-(--color-text-primary)">{post.author.name}</span>
            </span>
            <span>{formatRelativeTime(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {post.replyCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
