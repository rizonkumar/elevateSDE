import { Reveal } from './Reveal';

const STATS = [
  { value: '45%', label: 'Faster preparation iteration' },
  { value: '98.4%', label: 'AI evaluation accuracy vs. seniors' },
  { value: '10k+', label: 'Mock interview rounds simulated' },
  { value: '2.7k+', label: 'Coding problems in the bank' },
];

export function StatsBand() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <dl className="grid grid-cols-2 divide-y divide-(--color-border-subtle) rounded-lg border border-(--color-border-subtle) bg-(--color-surface) sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1.5 px-6 py-7">
              <dt className="font-display text-3xl font-bold tracking-tight text-(--color-text-primary) sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="font-mono text-xs uppercase tracking-[0.08em] text-(--color-text-muted)">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  );
}
