'use client';

import * as React from 'react';
import { UploadCloud, FileText, Loader2, RefreshCw } from 'lucide-react';
import { ACCEPTED_RESUME_TYPES } from '@/lib/resume-parser';

interface ResumeDropzoneProps {
  readonly onFile: (file: File) => void;
  readonly isAnalyzing: boolean;
  readonly fileName?: string | null;
  readonly variant?: 'full' | 'compact';
}

const acceptAttr = ACCEPTED_RESUME_TYPES.flatMap((type) => [type.mime, type.extension]).join(',');

export function ResumeDropzone({
  onFile,
  isAnalyzing,
  fileName,
  variant = 'full',
}: ResumeDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const open = () => {
    if (!isAnalyzing) inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const dropHandlers = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (!isAnalyzing) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (!isAnalyzing) handleFiles(event.dataTransfer.files);
    },
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={acceptAttr}
      className="hidden"
      onChange={(event) => {
        handleFiles(event.target.files);
        event.target.value = '';
      }}
    />
  );

  if (variant === 'compact') {
    return (
      <div
        {...dropHandlers}
        className={`flex items-center gap-3 rounded-(--radius-md) border border-dashed px-4 py-3 transition-colors ${
          dragging
            ? 'border-(--color-accent) bg-(--color-accent-soft)'
            : 'border-(--color-border-subtle)'
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-0 truncate text-sm font-medium text-(--color-text-primary)">
            {fileName ?? 'Drop a new resume'}
          </p>
          <p className="mb-0 text-xs text-(--color-text-muted)">
            {isAnalyzing ? 'Analyzing…' : 'PDF or DOCX, up to 5 MB'}
          </p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={isAnalyzing}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) px-3 py-1.5 text-xs font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-badge-bg) disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Replace
        </button>
        {input}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-disabled={isAnalyzing}
      onClick={open}
      {...dropHandlers}
      className={`flex w-full flex-col items-center justify-center gap-4 rounded-(--radius-md) border-2 border-dashed px-6 py-14 text-center transition-colors ${
        isAnalyzing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      } ${
        dragging
          ? 'border-(--color-accent) bg-(--color-accent-soft)'
          : 'border-(--color-border-subtle) hover:border-(--color-accent) hover:bg-(--color-accent-soft)'
      }`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
        {isAnalyzing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <UploadCloud className="h-6 w-6" />
        )}
      </span>
      <div>
        <p className="mb-1 text-base font-semibold text-(--color-text-primary)">
          {isAnalyzing ? 'Analyzing your resume…' : 'Drop your resume here'}
        </p>
        <p className="mb-0 text-sm text-(--color-text-muted)">
          PDF or DOCX, up to 5 MB — or click to browse.
        </p>
      </div>
      {input}
    </button>
  );
}
