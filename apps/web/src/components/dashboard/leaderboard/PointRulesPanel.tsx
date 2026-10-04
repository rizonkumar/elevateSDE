import { CalendarCheck, ChevronDown, Code, RotateCcw, Trophy, type LucideIcon } from 'lucide-react';
import { POINT_RULES, type AssessmentDifficulty } from '@elevatesde/shared-types';

interface PointRule {
  icon: LucideIcon;
  title: string;
  detail: string;
}

const DIFFICULTY_LABELS: Record<AssessmentDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const DIFFICULTY_ORDER: AssessmentDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const problemPoints = DIFFICULTY_ORDER.map(
  (difficulty) => `${DIFFICULTY_LABELS[difficulty]} +${POINT_RULES.problemSolved[difficulty]}`,
).join(' · ');

const podiumBonus = POINT_RULES.contestPodiumBonus.map((bonus) => `+${bonus}`).join(' / ');

const POINT_RULE_ITEMS: PointRule[] = [
  {
    icon: Code,
    title: 'Solve a problem',
    detail: `${problemPoints}. Only your first accepted solution counts.`,
  },
  {
    icon: CalendarCheck,
    title: 'Daily challenge',
    detail: `+${POINT_RULES.dailyChallenge} bonus for solving today's challenge.`,
  },
  {
    icon: Trophy,
    title: 'Contests',
    detail: `Score ÷ ${POINT_RULES.contestScoreDivisor}, plus ${podiumBonus} for the top ${POINT_RULES.contestPodiumBonus.length}.`,
  },
  {
    icon: RotateCcw,
    title: 'Resets',
    detail: 'Weekly totals reset every Monday and monthly totals on the 1st, at 00:00 UTC.',
  },
];

export function PointRulesPanel() {
  return (
    <details className="group rounded-md border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-card)">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-(--color-text-primary) [&::-webkit-details-marker]:hidden">
        How points work
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-(--color-text-muted) transition-transform group-open:rotate-180"
        />
      </summary>
      <ul className="grid gap-4 border-t border-(--color-border-subtle) px-5 py-4 sm:grid-cols-2">
        {POINT_RULE_ITEMS.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-(--color-accent-soft) text-(--color-accent)">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-medium text-(--color-text-primary)">{title}</div>
              <div className="mt-0.5 text-sm leading-relaxed text-(--color-text-muted)">
                {detail}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
