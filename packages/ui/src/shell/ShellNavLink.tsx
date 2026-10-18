'use client';

import type { ShellLinkComponent, ShellNavItem } from './types';
import { ArrowUpRightIcon } from './icons';
import { ShellTooltip } from './ShellTooltip';

interface ShellNavLinkProps {
  item: ShellNavItem;
  active: boolean;
  rail: boolean;
  LinkComponent: ShellLinkComponent;
}

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)';

export function ShellNavLink({ item, active, rail, LinkComponent }: ShellNavLinkProps) {
  const Icon = item.icon;
  const badgeCount = item.badgeCount ?? 0;
  const showBadge = badgeCount > 0;
  const badgeText = badgeCount > 99 ? '99+' : String(badgeCount);
  const accessibleLabel = showBadge ? `${item.label}, ${badgeCount} pending` : item.label;

  const className = `group relative flex h-9 items-center gap-3 rounded-(--radius-sm) text-sm font-medium transition-colors ${FOCUS_RING} ${
    rail ? 'justify-center' : 'px-2.5'
  } ${
    active
      ? 'bg-(--color-accent-soft) text-(--color-text-primary) before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-(--color-accent)'
      : 'text-(--color-text-muted) hover:bg-(--color-badge-bg) hover:text-(--color-text-primary)'
  }`;

  const content = (
    <>
      <span className="relative flex shrink-0">
        <Icon
          className={`h-4 w-4 transition-colors ${
            active
              ? 'text-(--color-accent)'
              : 'text-(--color-text-disabled) group-hover:text-(--color-text-primary)'
          }`}
        />
        {rail && showBadge && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-(--color-accent) ring-2 ring-(--color-bg)" />
        )}
      </span>
      {!rail && <span className="truncate">{item.label}</span>}
      {!rail && item.external && (
        <ArrowUpRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-(--color-text-disabled)" />
      )}
      {!rail && showBadge && (
        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-(--radius-full) bg-(--color-accent-soft) px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-(--color-accent)">
          {badgeText}
        </span>
      )}
    </>
  );

  const ariaLabel = rail || showBadge ? accessibleLabel : undefined;

  return (
    <ShellTooltip label={item.label} enabled={rail}>
      {item.external ? (
        <a href={item.href} aria-label={ariaLabel} className={className}>
          {content}
        </a>
      ) : (
        <LinkComponent
          href={item.href}
          aria-current={active ? 'page' : undefined}
          aria-label={ariaLabel}
          className={className}
        >
          {content}
        </LinkComponent>
      )}
    </ShellTooltip>
  );
}
