'use client';

import * as React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Textarea } from '@elevatesde/ui';
import type { AdminProblemGuidanceDto } from '@elevatesde/shared-types';
import { Toggle } from '../../../components/ui';
import {
  fetchProblemGuidance,
  saveProblemEditorial,
  saveProblemHints,
} from '../../../lib/coding-problems-api';
import { useToastStore } from '../../../store/toast.store';

const MAX_HINTS = 5;
const MAX_HINT_LENGTH = 1000;
const MAX_COMPLEXITY_LENGTH = 60;

interface EditorialDraft {
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  isPublished: boolean;
}

interface HintDraft {
  id: number;
  content: string;
}

interface ProblemGuidancePanelProps {
  problemId: string;
}

const EMPTY_EDITORIAL: EditorialDraft = {
  approach: '',
  timeComplexity: '',
  spaceComplexity: '',
  isPublished: false,
};

interface AxiosErrorResponse {
  response?: { data?: { message?: string | string[] } };
}

function errorMessage(error: unknown, fallback: string): string {
  const message = (error as AxiosErrorResponse).response?.data?.message;
  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }
  return message ?? fallback;
}

function toEditorialDraft(guidance: AdminProblemGuidanceDto): EditorialDraft {
  if (!guidance.editorial) {
    return { ...EMPTY_EDITORIAL };
  }
  return {
    approach: guidance.editorial.approach,
    timeComplexity: guidance.editorial.timeComplexity,
    spaceComplexity: guidance.editorial.spaceComplexity,
    isPublished: guidance.editorial.isPublished,
  };
}

export function ProblemGuidancePanel({ problemId }: Readonly<ProblemGuidancePanelProps>) {
  const [loading, setLoading] = React.useState(true);
  const [savingEditorial, setSavingEditorial] = React.useState(false);
  const [savingHints, setSavingHints] = React.useState(false);
  const [editorial, setEditorial] = React.useState<EditorialDraft>(EMPTY_EDITORIAL);
  const [hints, setHints] = React.useState<HintDraft[]>([]);
  const nextHintId = React.useRef(0);

  const toHintDrafts = React.useCallback(
    (contents: string[]): HintDraft[] =>
      contents.map((content) => {
        nextHintId.current += 1;
        return { id: nextHintId.current, content };
      }),
    [],
  );

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProblemGuidance(problemId)
      .then((guidance) => {
        if (!active) return;
        setEditorial(toEditorialDraft(guidance));
        setHints(toHintDrafts(guidance.hints));
      })
      .catch((error: unknown) => {
        useToastStore
          .getState()
          .addToast(errorMessage(error, 'Could not load the editorial and hints.'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [problemId, toHintDrafts]);

  const editorialIncomplete =
    !editorial.approach.trim() ||
    !editorial.timeComplexity.trim() ||
    !editorial.spaceComplexity.trim();
  const hintsInvalid = hints.some((hint) => !hint.content.trim());

  const updateEditorial = (patch: Partial<EditorialDraft>) => {
    setEditorial((current) => ({ ...current, ...patch }));
  };

  const handleSaveEditorial = async () => {
    setSavingEditorial(true);
    try {
      const guidance = await saveProblemEditorial(problemId, editorial);
      setEditorial(toEditorialDraft(guidance));
      useToastStore.getState().addToast('Editorial saved.', 'success');
    } catch (error) {
      useToastStore
        .getState()
        .addToast(errorMessage(error, 'Could not save the editorial.'), 'error');
    } finally {
      setSavingEditorial(false);
    }
  };

  const handleSaveHints = async () => {
    setSavingHints(true);
    try {
      const guidance = await saveProblemHints(
        problemId,
        hints.map((hint) => hint.content),
      );
      setHints(toHintDrafts(guidance.hints));
      useToastStore.getState().addToast('Hints saved.', 'success');
    } catch (error) {
      useToastStore.getState().addToast(errorMessage(error, 'Could not save the hints.'), 'error');
    } finally {
      setSavingHints(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-(--color-text-muted)" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 text-sm font-semibold text-(--color-text-primary)">Editorial</h3>
            <p className="mt-1 mb-0 text-xs text-(--color-text-muted)">
              Shown after a candidate solves the problem or gives up. Reference solutions are
              included automatically.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-(--color-text-primary)">
            Published
            <Toggle
              checked={editorial.isPublished}
              onChange={(isPublished) => updateEditorial({ isPublished })}
              label="Publish editorial"
            />
          </label>
        </div>
        <Textarea
          label="Approach"
          value={editorial.approach}
          onChange={(event) => updateEditorial({ approach: event.target.value })}
          className="min-h-[160px]"
          placeholder="Explain the key insight, walk through the algorithm, and call out edge cases. Wrap code in backticks."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Time complexity"
            value={editorial.timeComplexity}
            maxLength={MAX_COMPLEXITY_LENGTH}
            onChange={(event) => updateEditorial({ timeComplexity: event.target.value })}
            placeholder="O(n)"
          />
          <Input
            label="Space complexity"
            value={editorial.spaceComplexity}
            maxLength={MAX_COMPLEXITY_LENGTH}
            onChange={(event) => updateEditorial({ spaceComplexity: event.target.value })}
            placeholder="O(1)"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSaveEditorial}
            disabled={savingEditorial || editorialIncomplete}
          >
            {savingEditorial ? 'Saving…' : 'Save editorial'}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-(--color-border-subtle) pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 text-sm font-semibold text-(--color-text-primary)">Hints</h3>
            <p className="mt-1 mb-0 text-xs text-(--color-text-muted)">
              Revealed one at a time, in this order. Up to {MAX_HINTS} hints.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setHints((current) => [...current, ...toHintDrafts([''])])}
            disabled={hints.length >= MAX_HINTS}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            Add hint
          </Button>
        </div>
        {hints.length === 0 ? (
          <p className="m-0 rounded-(--radius-sm) border border-dashed border-(--color-border-subtle) p-4 text-center text-xs text-(--color-text-muted)">
            No hints yet.
          </p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {hints.map((hint, index) => (
              <li key={hint.id} className="flex items-start gap-2">
                <span className="mt-2.5 w-14 shrink-0 text-xs font-semibold text-(--color-text-muted)">
                  Hint {index + 1}
                </span>
                <Textarea
                  value={hint.content}
                  maxLength={MAX_HINT_LENGTH}
                  onChange={(event) =>
                    setHints((current) =>
                      current.map((item) =>
                        item.id === hint.id ? { ...item, content: event.target.value } : item,
                      ),
                    )
                  }
                  className="min-h-[64px] flex-1"
                  placeholder="Nudge the candidate without giving the answer away."
                />
                <button
                  type="button"
                  aria-label={`Remove hint ${index + 1}`}
                  onClick={() =>
                    setHints((current) => current.filter((item) => item.id !== hint.id))
                  }
                  className="mt-2 cursor-pointer rounded-(--radius-sm) p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="flex justify-end">
          <Button type="button" onClick={handleSaveHints} disabled={savingHints || hintsInvalid}>
            {savingHints ? 'Saving…' : 'Save hints'}
          </Button>
        </div>
      </section>
    </div>
  );
}
