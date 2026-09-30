import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

const STEPS = [
  {
    step: '01',
    title: 'Choose the interview',
    body: 'Start from a tracked application and confirm the deadline, company archetype, and expected rounds.',
  },
  {
    step: '02',
    title: 'Close the visible gaps',
    body: 'Follow prioritized coding, review, learning, resume, mock interview, and peer-practice actions.',
  },
  {
    step: '03',
    title: 'Inspect the evidence',
    body: 'Track round status, coverage, and confidence without turning missing activity into a failing score.',
  },
];

export function HowItWorks() {
  return (
    <SectionShell id="how-it-works" bordered>
      <Reveal>
        <SectionHeading
          kicker="How it works"
          title="From application to interview plan in three steps"
          description="Start with the role in front of you. Adjust every assumption as the interview changes."
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
