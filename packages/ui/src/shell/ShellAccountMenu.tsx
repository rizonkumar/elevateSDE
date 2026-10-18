'use client';

import * as React from 'react';
import type { ShellIcon, ShellLinkComponent } from './types';
import { ArrowUpRightIcon, ChevronDownIcon } from './icons';

const MenuCloseContext = React.createContext<() => void>(() => undefined);

interface ShellAccountMenuProps {
  name: string;
  email: string;
  initial: string;
  roleLabel: string;
  children: React.ReactNode;
}

export function ShellAccountMenu({
  name,
  email,
  initial,
  roleLabel,
  children,
}: ShellAccountMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    const items = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();

    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const list = items();
      if (list.length === 0) return;
      event.preventDefault();
      const currentIndex = list.findIndex((item) => item === document.activeElement);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + delta + list.length) % list.length;
      list[nextIndex]?.focus();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu for ${name}`}
        className="flex h-9 items-center gap-1.5 rounded-(--radius-sm) pl-1 pr-1.5 transition-colors hover:bg-(--color-badge-bg) cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-accent) text-xs font-semibold text-white">
          {initial}
        </span>
        <ChevronDownIcon
          className={`hidden h-3.5 w-3.5 text-(--color-text-disabled) transition-transform sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-popover)"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-sm font-semibold text-white">
              {initial}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-(--color-text-primary)">
                {name}
              </span>
              <span className="truncate text-xs text-(--color-text-muted)">{email}</span>
            </div>
            <span className="shrink-0 rounded-(--radius-full) border border-(--color-border-subtle) px-2 py-0.5 text-[11px] font-medium text-(--color-text-muted)">
              {roleLabel}
            </span>
          </div>
          <MenuCloseContext.Provider value={close}>{children}</MenuCloseContext.Provider>
        </div>
      )}
    </div>
  );
}

export function ShellMenuSeparator() {
  return <div role="separator" className="h-px bg-(--color-border-subtle)" />;
}

export function ShellMenuSection({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col p-1">{children}</div>;
}

interface ShellMenuItemProps {
  label: string;
  icon: ShellIcon;
  href?: string;
  external?: boolean;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  LinkComponent?: ShellLinkComponent;
}

export function ShellMenuItem({
  label,
  icon: Icon,
  href,
  external = false,
  onSelect,
  tone = 'default',
  LinkComponent,
}: ShellMenuItemProps) {
  const close = React.useContext(MenuCloseContext);
  const className = `flex h-9 w-full items-center gap-2.5 rounded-(--radius-sm) px-2.5 text-left text-sm font-medium transition-colors cursor-pointer focus:outline-none ${
    tone === 'danger'
      ? 'text-(--color-text-primary) hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:bg-(--color-danger-soft) focus-visible:text-(--color-danger)'
      : 'text-(--color-text-primary) hover:bg-(--color-badge-bg) focus-visible:bg-(--color-badge-bg)'
  }`;
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-(--color-text-disabled)" />
      <span className="flex-1 truncate">{label}</span>
      {external && <ArrowUpRightIcon className="h-3.5 w-3.5 text-(--color-text-disabled)" />}
    </>
  );

  const handleSelect = () => {
    close();
    onSelect?.();
  };

  if (href && !external && LinkComponent) {
    return (
      <LinkComponent
        href={href}
        role="menuitem"
        tabIndex={-1}
        onClick={handleSelect}
        className={className}
      >
        {content}
      </LinkComponent>
    );
  }

  if (href) {
    return (
      <a href={href} role="menuitem" tabIndex={-1} onClick={handleSelect} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={handleSelect}
      className={className}
    >
      {content}
    </button>
  );
}
