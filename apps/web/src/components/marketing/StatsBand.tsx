const STATS = [
  { value: '45%', label: 'Faster preparation iteration time' },
  { value: '98.4%', label: 'AI evaluation accuracy vs. human seniors' },
  { value: '10k+', label: 'Mock interview rounds simulated' },
];

export function StatsBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) px-6 py-7 shadow-(--shadow-soft)"
          >
            <div className="font-display text-3xl font-bold tracking-tight text-(--color-text-primary) sm:text-4xl">
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-(--color-text-muted)">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
