import type { ReactNode } from 'react';

interface SectionHeadingProps {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left';
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignment} ${className}`}>
      {kicker ? (
        <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-(--color-accent)">
          {kicker}
        </span>
      ) : null}
      <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-(--color-text-primary) sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-relaxed text-(--color-text-muted)">{description}</p>
      ) : null}
    </div>
  );
}
