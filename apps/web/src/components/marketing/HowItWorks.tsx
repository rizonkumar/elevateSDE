const STEPS = [
  {
    step: '01',
    title: 'Set up your profile',
    body: 'Create an account, pick your target role, and import your resume in seconds.',
  },
  {
    step: '02',
    title: 'Practice with AI',
    body: 'Run timed mock interviews and assessments tailored to your level and company style.',
  },
  {
    step: '03',
    title: 'Improve and track',
    body: 'Review scored feedback, follow a personalized plan, and track every application to offer.',
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-(--color-text-primary) sm:text-3xl">
          How it works
        </h2>
        <p className="mt-2 text-sm text-(--color-text-muted) sm:text-base">
          Three steps from sign-up to interview-ready.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="flex flex-col gap-3">
            <span className="font-display text-3xl font-bold text-(--color-accent)">
              {item.step}
            </span>
            <h3 className="text-base font-semibold text-(--color-text-primary)">{item.title}</h3>
            <p className="text-sm leading-relaxed text-(--color-text-muted)">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
