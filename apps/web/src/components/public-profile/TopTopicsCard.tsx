import type { PublicProfileTopicDto } from '@elevatesde/shared-types';
import { ProgressBar } from './ProgressBar';
import { EmptyNote, SectionCard } from './SectionCard';

export function TopTopicsCard({
  topics,
  className,
}: Readonly<{
  topics: PublicProfileTopicDto[];
  className?: string;
}>) {
  const max = topics.reduce((highest, topic) => Math.max(highest, topic.solved), 0);
  return (
    <SectionCard className={className} title="Top topics">
      {topics.length === 0 ? (
        <EmptyNote>Topic strengths appear after the first few solves.</EmptyNote>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {topics.map((topic) => (
            <li key={topic.slug} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-(--color-text-primary)">
                  {topic.name}
                </span>
                <span className="shrink-0 tabular-nums text-(--color-text-muted)">
                  {topic.solved} solved
                </span>
              </div>
              <ProgressBar
                value={topic.solved}
                max={max}
                toneClass="bg-(--color-accent)"
                label={`${topic.name} problems solved`}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
