'use client';

import * as React from 'react';
import type { ShellLinkComponent, ShellNavGroupConfig } from './types';
import { CloseIcon, PanelCollapseIcon, PanelExpandIcon } from './icons';
import { ShellNavGroup } from './ShellNavGroup';
import { ShellNavLink } from './ShellNavLink';
import { ShellTooltip } from './ShellTooltip';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)';

interface ShellSidebarProps {
  groups: ShellNavGroupConfig[];
  activeHref: string | null;
  renderBrand: (compact: boolean) => React.ReactNode;
  LinkComponent: ShellLinkComponent;
  collapseStorageKey: string;
  open: boolean;
  onClose: () => void;
}

export function ShellSidebar({
  groups,
  activeHref,
  renderBrand,
  LinkComponent,
  collapseStorageKey,
  open,
  onClose,
}: ShellSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const drawerRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(collapseStorageKey) === 'true');
  }, [collapseStorageKey]);

  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(collapseStorageKey, String(next));
      return next;
    });
  };

  const renderNav = (rail: boolean) => (
    <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      {groups.map((group, index) => (
        <ShellNavGroup key={group.id} label={group.label} rail={rail} isFirst={index === 0}>
          {group.items.map((item) => (
            <ShellNavLink
              key={item.href}
              item={item}
              active={item.href === activeHref}
              rail={rail}
              LinkComponent={LinkComponent}
            />
          ))}
        </ShellNavGroup>
      ))}
    </nav>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-(--color-border-subtle) bg-(--color-bg) transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div
          className={`flex h-14 shrink-0 items-center border-b border-(--color-border-subtle) ${
            collapsed ? 'justify-center' : 'px-5'
          }`}
        >
          {renderBrand(collapsed)}
        </div>

        {renderNav(collapsed)}

        <div className="shrink-0 border-t border-(--color-border-subtle) p-3">
          <ShellTooltip label="Expand sidebar" enabled={collapsed}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={`flex h-9 w-full items-center gap-3 rounded-(--radius-sm) text-sm font-medium text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer ${FOCUS_RING} ${
                collapsed ? 'justify-center' : 'px-2.5'
              }`}
            >
              {collapsed ? (
                <PanelExpandIcon className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <PanelCollapseIcon className="h-4 w-4 shrink-0 text-(--color-text-disabled)" />
                  Collapse
                </>
              )}
            </button>
          </ShellTooltip>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? 'visible' : 'invisible transition-[visibility] delay-200'
        }`}
        inert={!open}
      >
        <div
          aria-hidden="true"
          onClick={onClose}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col border-r border-(--color-border-subtle) bg-(--color-bg) shadow-(--shadow-modal) transition-transform duration-200 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-(--color-border-subtle) px-5">
            {renderBrand(false)}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className={`-mr-1.5 rounded-(--radius-sm) p-1.5 text-(--color-text-muted) transition-colors hover:bg-(--color-badge-bg) hover:text-(--color-text-primary) cursor-pointer ${FOCUS_RING}`}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          {renderNav(false)}
        </aside>
      </div>
    </>
  );
}
