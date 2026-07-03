'use client';

import * as React from 'react';
import { Modal, Input, Textarea, Button } from '@elevatesde/ui';
import { useToastStore } from '@/store/toast.store';
import { useProblemSocialStore } from '@/store/problem-social.store';

interface DiscussionComposerProps {
  problemId: string;
  open: boolean;
  onClose: () => void;
}

export function DiscussionComposer({
  problemId,
  open,
  onClose,
}: Readonly<DiscussionComposerProps>) {
  const createDiscussion = useProblemSocialStore((state) => state.createDiscussion);
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setTitle('');
      setBody('');
    }
  }, [open]);

  const submit = async () => {
    if (title.trim().length < 8) {
      addToast('Give your discussion a clearer title (at least 8 characters).', 'error');
      return;
    }
    if (body.trim().length < 8) {
      addToast('Add a little more detail to your discussion.', 'error');
      return;
    }
    const created = await createDiscussion(problemId, { title: title.trim(), body: body.trim() });
    if (created) {
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start a discussion"
      description="Ask a question or share an approach for this problem."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          label="Title"
          placeholder="e.g. Cleaner O(n) approach without extra space?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
        />
        <Textarea
          label="Details"
          placeholder="Share your reasoning, edge cases, or the specific question."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          maxLength={8000}
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Post discussion</Button>
        </div>
      </form>
    </Modal>
  );
}
