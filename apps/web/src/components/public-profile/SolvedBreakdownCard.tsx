import type { AssessmentDifficulty, PublicProfileDto } from '@elevatesde/shared-types';
import { ProgressBar } from './ProgressBar';
import { SectionCard } from './SectionCard';

const DIFFICULTIES: { key: AssessmentDifficulty; label: string; text: string; fill: string }[] = [
  { key: 'EASY', label: 'Easy', text: 'text-(--color-success)', fill: 'bg-(--color-success)' },
  { key: 'MEDIUM', label: 'Medium', text: 'text-(--color-warning)', fill: 'bg-(--color-warning)' },
  { key: 'HARD', label: 'Hard', text: 'text-(--color-danger)', fill: 'bg-(--color-danger)' },
];

function SolvedComposition({ profile }: Readonly<{ profile: PublicProfileDto }>) {
  const { solved } = profile;
  if (solved.solved === 0) {
    return (
      <p className="m-0 text-sm text-(--color-text-muted)">
        No problems solved yet. Progress shows up here after the first accepted solution.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div
        aria-hidden="true"
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-(--radius-full) bg-(--color-badge-bg)"
      >
        {DIFFICULTIES.map((difficulty) => {
          const share = (solved.byDifficulty[difficulty.key].solved / solved.solved) * 100;
          return share > 0 ? (
            <div
              key={difficulty.key}
              className={`h-full ${difficulty.fill}`}
              style={{ width: `${share}%` }}
            />
          ) : null;
        })}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-(--color-text-muted)">
        {DIFFICULTIES.map((difficulty) => {
          const share = Math.round(
            (solved.byDifficulty[difficulty.key].solved / solved.solved) * 100,
          );
          return (
            <li key={difficulty.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-(--radius-full) ${difficulty.fill}`} />
              {difficulty.label} {share}%
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SolvedBreakdownCard({
  profile,
  className,
}: Readonly<{
  profile: PublicProfileDto;
  className?: string;
}>) {
  const { solved } = profile;
  const percent = solved.total > 0 ? Math.round((solved.solved / solved.total) * 100) : 0;
  return (
    <SectionCard className={className} title="Solved" aside={`${percent}% of the problem bank`}>
      <div className="mb-5 flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold tracking-tight text-(--color-metric-text) tabular-nums">
          {solved.solved}
        </span>
        <span className="text-sm text-(--color-text-muted)">/ {solved.total} problems</span>
      </div>
      <SolvedComposition profile={profile} />
      <ul className="m-0 mt-6 flex list-none flex-col gap-4 p-0">
        {DIFFICULTIES.map((difficulty) => {
          const count = solved.byDifficulty[difficulty.key];
          return (
            <li key={difficulty.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${difficulty.text}`}>{difficulty.label}</span>
                <span className="tabular-nums text-(--color-text-muted)">
                  <span className="font-semibold text-(--color-text-primary)">{count.solved}</span>{' '}
                  / {count.total}
                </span>
              </div>
              <ProgressBar
                value={count.solved}
                max={count.total}
                toneClass={difficulty.fill}
                label={`${difficulty.label} problems solved`}
              />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
