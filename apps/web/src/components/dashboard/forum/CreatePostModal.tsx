'use client';

import * as React from 'react';
import { Modal, Input, Textarea, Button } from '@elevatesde/ui';
import { useToastStore } from '@/store/toast.store';
import { useForumStore } from '@/store/forum.store';
import { FORUM_TAGS } from '@/lib/forum-data';

export function CreatePostModal() {
  const isOpen = useForumStore((state) => state.isModalOpen);
  const closeModal = useForumStore((state) => state.closeModal);
  const createPost = useForumStore((state) => state.createPost);
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setBody('');
      setTags([]);
    }
  }, [isOpen]);

  const toggleTag = (id: string) => {
    setTags((current) =>
      current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id],
    );
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (title.trim().length < 8) {
      addToast('Give your question a clearer title (at least 8 characters).', 'error');
      return;
    }
    if (body.trim().length < 20) {
      addToast('Add a little more detail to your post.', 'error');
      return;
    }
    createPost({ title, body, tags });
  };

  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      title="Start a discussion"
      description="Ask a question or share what worked for you."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          label="Title"
          placeholder="e.g. How do you structure a system design answer?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={140}
        />
        <Textarea
          label="Details"
          placeholder="Share the context, what you have tried, and the specific question."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
        />
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-(--color-text-primary) select-none">
            Topics
          </span>
          <div className="flex flex-wrap gap-2">
            {FORUM_TAGS.map((tag) => {
              const active = tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-(--radius-full) border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-accent)] ${
                    active
                      ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
                      : 'border-(--color-border-subtle) bg-(--color-surface) text-(--color-text-muted) hover:text-(--color-text-primary)'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button type="submit">Publish post</Button>
        </div>
      </form>
    </Modal>
  );
}
