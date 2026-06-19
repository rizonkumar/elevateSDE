'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MessagesSquare } from 'lucide-react';
import { Button, Tabs, Input, type TabItem } from '@elevatesde/ui';
import type { ForumSortOption } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TagFilter } from '@/components/dashboard/forum/TagFilter';
import { PostCard } from '@/components/dashboard/forum/PostCard';
import { CreatePostModal } from '@/components/dashboard/forum/CreatePostModal';
import { useForumStore, filterAndSortPosts } from '@/store/forum.store';

const SORT_TABS: TabItem[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Popular' },
  { id: 'unanswered', label: 'Unanswered' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export default function ForumPage() {
  const posts = useForumStore((state) => state.posts);
  const sort = useForumStore((state) => state.sort);
  const activeTag = useForumStore((state) => state.activeTag);
  const query = useForumStore((state) => state.query);
  const visibleCount = useForumStore((state) => state.visibleCount);
  const setSort = useForumStore((state) => state.setSort);
  const setTag = useForumStore((state) => state.setTag);
  const setQuery = useForumStore((state) => state.setQuery);
  const loadMore = useForumStore((state) => state.loadMore);
  const togglePostUpvote = useForumStore((state) => state.togglePostUpvote);
  const openModal = useForumStore((state) => state.openModal);

  const matched = React.useMemo(
    () => filterAndSortPosts(posts, { sort, activeTag, query }),
    [posts, sort, activeTag, query],
  );
  const visible = matched.slice(0, visibleCount);
  const hasMore = visibleCount < matched.length;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 sm:gap-8">
        <PageHeader
          kicker="Community"
          title="Discussion forum"
          description="Trade interview experiences, compare offers, and learn from the people preparing alongside you."
          actions={
            <Button onClick={openModal}>
              <Plus className="h-4 w-4" />
              New post
            </Button>
          }
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={SORT_TABS} value={sort} onChange={(id) => setSort(id as ForumSortOption)} />
            <div className="sm:w-72">
              <Input
                placeholder="Search discussions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
          <TagFilter activeTag={activeTag} onChange={setTag} />
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-(--color-border-subtle) bg-(--color-surface) px-6 py-16 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--color-badge-bg) text-(--color-text-muted)">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <p className="m-0 text-sm text-(--color-text-muted)">
              No discussions match your filters yet.
            </p>
          </div>
        ) : (
          <motion.div
            key={`${sort}-${activeTag}-${query}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            {visible.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <PostCard post={post} onUpvote={togglePostUpvote} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {hasMore && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>

      <CreatePostModal />
    </PageContainer>
  );
}
