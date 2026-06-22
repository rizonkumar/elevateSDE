import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

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
    <SectionShell id="how-it-works" bordered>
      <Reveal>
        <SectionHeading
          kicker="How it works"
          title="Three steps from sign-up to interview-ready"
          description="No setup overhead. Start practicing the same day you join."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <ol className="grid gap-px overflow-hidden rounded-lg border border-(--color-border-subtle) bg-(--color-border-subtle) sm:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="flex flex-col gap-3 bg-(--color-surface) p-7">
              <span className="font-mono text-sm font-semibold tracking-widest text-(--color-accent)">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-(--color-text-primary)">{item.title}</h3>
              <p className="text-sm leading-relaxed text-(--color-text-muted)">{item.body}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </SectionShell>
  );
}
