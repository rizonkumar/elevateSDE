'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Textarea } from '@elevatesde/ui';
import { useProblemSocialStore } from '@/store/problem-social.store';

const AUTOSAVE_DELAY_MS = 800;

interface NotesTabProps {
  problemId: string;
}

export function NotesTab({ problemId }: Readonly<NotesTabProps>) {
  const note = useProblemSocialStore((state) => state.notes[problemId]);
  const isSaving = useProblemSocialStore((state) => state.isSavingNote);
  const fetchNote = useProblemSocialStore((state) => state.fetchNote);
  const saveNote = useProblemSocialStore((state) => state.saveNote);

  const [value, setValue] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);
  const dirtyRef = React.useRef(false);

  React.useEffect(() => {
    dirtyRef.current = false;
    if (useProblemSocialStore.getState().notes[problemId] !== undefined) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    void fetchNote(problemId).finally(() => setLoaded(true));
  }, [problemId, fetchNote]);

  React.useEffect(() => {
    if (loaded && !dirtyRef.current) {
      setValue(note?.body ?? '');
    }
  }, [loaded, note]);

  React.useEffect(() => {
    if (!loaded || !dirtyRef.current) {
      return;
    }
    const handle = setTimeout(() => {
      void saveNote(problemId, value);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [value, loaded, problemId, saveNote]);

  const persisted = note?.body ?? '';
  const isDirty = loaded && value !== persisted;
  const showSaved = !isSaving && !isDirty && note !== null && note !== undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-sm text-(--color-text-muted)">
          Only you can see these notes. Changes save automatically.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs text-(--color-text-muted)">
          {isSaving && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          )}
          {showSaved && (
            <>
              <Check className="h-3.5 w-3.5 text-(--color-accent)" />
              Saved
            </>
          )}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => {
          dirtyRef.current = true;
          setValue(event.target.value);
        }}
        placeholder="Jot down your approach, complexity analysis, or things to revisit."
        rows={14}
        maxLength={8000}
        disabled={!loaded}
        className="min-h-[260px]"
      />
    </div>
  );
}
