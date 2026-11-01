'use client';

import * as React from 'react';
import { BookOpenCheck, Flag, Loader2, Lock } from 'lucide-react';
import { Badge, Button, ConfirmDialog } from '@elevatesde/ui';
import type { AssessmentLanguage, ProblemEditorialDto } from '@elevatesde/shared-types';
import { useProblemAssistanceStore } from '@/store/problem-assistance.store';
import { SegmentedControl } from './SegmentedControl';
import { ParagraphText } from './problem-text';

const LANGUAGE_ORDER: readonly AssessmentLanguage[] = ['python', 'javascript', 'cpp'];

const LANGUAGE_LABEL: Record<AssessmentLanguage, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
};

interface EditorialTabProps {
  problemId: string;
}

function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: Readonly<{
  icon: typeof Lock;
  title: string;
  body: string;
  children?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-(--color-badge-bg)">
        <Icon className="h-5 w-5 text-(--color-text-muted)" />
      </div>
      <h3 className="m-0 text-base font-semibold text-(--color-text-primary)">{title}</h3>
      <p className="mt-1.5 mb-0 max-w-sm text-sm text-(--color-text-muted)">{body}</p>
      {children}
    </div>
  );
}

function EditorialContent({ editorial }: Readonly<{ editorial: ProblemEditorialDto }>) {
  const languages = LANGUAGE_ORDER.filter((language) => Boolean(editorial.solutions[language]));
  const [language, setLanguage] = React.useState<AssessmentLanguage | null>(languages[0] ?? null);
  const activeLanguage = language && languages.includes(language) ? language : languages[0];
  const code = activeLanguage ? editorial.solutions[activeLanguage] : undefined;

  return (
    <div className="flex flex-col gap-6">
      {editorial.unlockReason === 'GAVE_UP' && (
        <p className="m-0 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-3 text-xs text-(--color-text-muted)">
          You opened this editorial before solving. Solving this problem now still marks it solved,
          but it will not earn points or daily streak credit.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">Time {editorial.timeComplexity}</Badge>
        <Badge variant="neutral">Space {editorial.spaceComplexity}</Badge>
      </div>

      <section>
        <h3 className="m-0 mb-2.5 text-sm font-semibold text-(--color-text-primary)">Approach</h3>
        <ParagraphText text={editorial.approach} />
      </section>

      {activeLanguage && code && (
        <section>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 text-sm font-semibold text-(--color-text-primary)">Solution</h3>
            {languages.length > 1 && (
              <SegmentedControl
                value={activeLanguage}
                options={languages.map((value) => ({ value, label: LANGUAGE_LABEL[value] }))}
                onChange={setLanguage}
                ariaLabel="Solution language"
              />
            )}
          </div>
          <pre className="m-0 overflow-x-auto rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4 font-mono text-xs leading-relaxed text-(--color-text-primary)">
            <code>{code}</code>
          </pre>
        </section>
      )}
    </div>
  );
}

export function EditorialTab({ problemId }: Readonly<EditorialTabProps>) {
  const assistance = useProblemAssistanceStore((state) => state.assistance[problemId]);
  const editorial = useProblemAssistanceStore((state) => state.editorials[problemId]);
  const isGivingUp = useProblemAssistanceStore((state) => state.isGivingUp);
  const isLoadingEditorial = useProblemAssistanceStore((state) => state.isLoadingEditorial);
  const fetchAssistance = useProblemAssistanceStore((state) => state.fetchAssistance);
  const fetchEditorial = useProblemAssistanceStore((state) => state.fetchEditorial);
  const giveUp = useProblemAssistanceStore((state) => state.giveUp);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    void fetchAssistance(problemId);
  }, [problemId, fetchAssistance]);

  const isUnlocked = assistance?.editorial === 'UNLOCKED';

  React.useEffect(() => {
    if (isUnlocked && !editorial) {
      void fetchEditorial(problemId);
    }
  }, [isUnlocked, editorial, problemId, fetchEditorial]);

  if (!assistance || (isUnlocked && !editorial && isLoadingEditorial)) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-(--color-text-muted)" />
      </div>
    );
  }

  if (assistance.editorial === 'UNAVAILABLE') {
    return (
      <EmptyState
        icon={BookOpenCheck}
        title="No editorial yet"
        body="An editorial for this problem has not been published. Check the Discuss tab for community approaches."
      />
    );
  }

  if (assistance.lockedByContest) {
    return (
      <EmptyState
        icon={Lock}
        title="Locked during the contest"
        body="The editorial opens again once the live contest that includes this problem ends."
      />
    );
  }

  if (isUnlocked && editorial) {
    return <EditorialContent editorial={editorial} />;
  }

  return (
    <>
      <EmptyState
        icon={Lock}
        title="Editorial locked"
        body="Get an accepted submission to unlock the editorial, or give up to read it now."
      >
        <Button
          type="button"
          variant="secondary"
          className="mt-5"
          onClick={() => setConfirmOpen(true)}
        >
          <Flag className="mr-1.5 h-4 w-4" />
          Give up and view editorial
        </Button>
      </EmptyState>
      <ConfirmDialog
        open={confirmOpen}
        title="Give up on this problem?"
        description="You can still solve it afterwards and it will count as solved, but it will not earn points or daily streak credit."
        confirmLabel="View editorial"
        loading={isGivingUp}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void giveUp(problemId).then((unlocked) => {
            if (unlocked) {
              setConfirmOpen(false);
            }
          });
        }}
      />
    </>
  );
}
