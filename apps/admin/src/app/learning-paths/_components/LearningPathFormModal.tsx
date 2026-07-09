'use client';

import * as React from 'react';
import { Button, Input, Modal, Textarea } from '@elevatesde/ui';
import type { AdminLearningPathDetailDto, PathLevel } from '@elevatesde/shared-types';
import { Select } from '../../../components/ui';
import { TagsInput } from '../../coding-problems/_components/TagsInput';
import type { LearningPathFormValues } from '../../../store/learning-paths.store';

const LEVEL_OPTIONS: { value: PathLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

interface LearningPathFormModalProps {
  open: boolean;
  saving: boolean;
  editingPath: AdminLearningPathDetailDto | null;
  onClose: () => void;
  onSave: (values: LearningPathFormValues) => void;
}

export function LearningPathFormModal({
  open,
  saving,
  editingPath,
  onClose,
  onSave,
}: Readonly<LearningPathFormModalProps>) {
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [level, setLevel] = React.useState<PathLevel>('BEGINNER');
  const [tags, setTags] = React.useState<string[]>([]);
  const [coverImage, setCoverImage] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(editingPath?.title ?? '');
    setSlug(editingPath?.slug ?? '');
    setDescription(editingPath?.description ?? '');
    setLevel(editingPath?.level ?? 'BEGINNER');
    setTags(editingPath?.tags ?? []);
    setCoverImage(editingPath?.coverImage ?? '');
  }, [open, editingPath]);

  const canSave = title.trim().length > 0 && slug.trim().length > 0 && !saving;

  const handleSave = () => {
    const trimmedCover = coverImage.trim();
    onSave({
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      level,
      tags,
      coverImage: trimmedCover.length > 0 ? trimmedCover : null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPath ? 'Edit learning path' : 'New learning path'}
      description="Set the track details. Add modules and problems from the builder."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="FAANG DSA Prep"
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="faang-dsa-prep"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="A structured roadmap covering arrays, graphs, and dynamic programming."
        />
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-(--color-text-primary)">Level</span>
          <Select
            value={level}
            options={LEVEL_OPTIONS}
            onChange={(next) => setLevel(next as PathLevel)}
          />
        </div>
        <TagsInput label="Tags" value={tags} onChange={setTags} placeholder="Add a tag" />
        <Input
          label="Cover image URL"
          value={coverImage}
          onChange={(event) => setCoverImage(event.target.value)}
          placeholder="https://cdn.example.com/cover.png"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {editingPath ? 'Save changes' : 'Create path'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
