'use client';

import * as React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Modal } from '@elevatesde/ui';
import type { SubmissionDetailDto } from '@elevatesde/shared-types';
import { useAssessmentSettingsStore } from '@/store/assessment-settings.store';
import { formatRelativeTime } from '@/lib/relative-time';
import { useThemeMode } from './useThemeMode';
import {
  LANGUAGE_LABEL,
  MONACO_LANGUAGE,
  SUBMISSION_STATUS_LABEL,
  statusTextClass,
} from './submission-format';

interface SubmissionCompareModalProps {
  open: boolean;
  older: SubmissionDetailDto | null;
  newer: SubmissionDetailDto | null;
  loading: boolean;
  onClose: () => void;
}

function SideLabel({ submission }: Readonly<{ submission: SubmissionDetailDto }>) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <span className={`font-semibold ${statusTextClass(submission.status)}`}>
        {SUBMISSION_STATUS_LABEL[submission.status]}
      </span>
      <span className="text-(--color-text-muted)">
        {LANGUAGE_LABEL[submission.language]} · {formatRelativeTime(submission.createdAt)}
      </span>
    </div>
  );
}

export function SubmissionCompareModal({
  open,
  older,
  newer,
  loading,
  onClose,
}: Readonly<SubmissionCompareModalProps>) {
  const editorTheme = useAssessmentSettingsStore((state) => state.editorTheme);
  const systemMode = useThemeMode();
  const mode = editorTheme === 'system' ? systemMode : editorTheme;
  const sameLanguage = older && newer && older.language === newer.language;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compare submissions"
      description="Older submission on the left, newer on the right."
      size="wide"
    >
      {loading || !older || !newer ? (
        <div className="flex h-[60vh] items-center justify-center text-sm text-(--color-text-muted)">
          Loading submissions…
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4">
            <SideLabel submission={older} />
            <SideLabel submission={newer} />
          </div>
          <div className="h-[60vh] overflow-hidden rounded-(--radius-sm) border border-(--color-border-subtle)">
            <DiffEditor
              height="100%"
              original={older.sourceCode}
              modified={newer.sourceCode}
              language={sameLanguage ? MONACO_LANGUAGE[newer.language] : 'plaintext'}
              theme={mode === 'dark' ? 'vs-dark' : 'light'}
              loading={
                <div className="flex h-full items-center justify-center text-sm text-(--color-text-muted)">
                  Loading diff…
                </div>
              }
              options={{
                readOnly: true,
                originalEditable: false,
                renderSideBySide: true,
                useInlineViewWhenSpaceIsLimited: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 13,
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
