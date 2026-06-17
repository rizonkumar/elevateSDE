'use client';

import * as React from 'react';
import { Bot, User } from 'lucide-react';
import type { TranscriptEntry } from '@elevatesde/shared-types';

interface TranscriptStreamProps {
  readonly transcript: readonly TranscriptEntry[];
}

export function TranscriptStream({ transcript }: TranscriptStreamProps) {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcript]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      {transcript.length === 0 ? (
        <p className="m-0 text-sm text-(--color-text-muted)">
          The transcript will appear here as the conversation unfolds.
        </p>
      ) : (
        transcript.map((entry) => {
          const isAi = entry.speaker === 'AI';
          const Icon = isAi ? Bot : User;
          return (
            <div
              key={entry.id}
              className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isAi
                    ? 'bg-(--color-badge-bg) text-(--color-text-muted)'
                    : 'bg-(--color-accent) text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div
                className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                  isAi
                    ? 'bg-(--color-bg-soft) text-(--color-text-primary)'
                    : 'bg-(--color-accent-soft) text-(--color-text-primary)'
                } ${entry.isFinal ? '' : 'italic text-(--color-text-muted)'}`}
              >
                {entry.text}
              </div>
            </div>
          );
        })
      )}
      <div ref={endRef} />
    </div>
  );
}
