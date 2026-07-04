'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  menuPlacement?: 'bottom' | 'top';
}

interface MenuCoords {
  top: number;
  left: number;
  width: number;
  placement: 'top' | 'bottom';
}

const MENU_MAX_HEIGHT = 256;

export function Select({
  value,
  options,
  onChange,
  disabled,
  className = '',
  menuPlacement,
}: Readonly<SelectProps>) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<MenuCoords | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'top' | 'bottom' =
      menuPlacement ?? (spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow ? 'top' : 'bottom');
    setCoords({
      top: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      placement,
    });
  }, [menuPlacement]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);

  const menu = coords && (
    <div
      ref={menuRef}
      role="listbox"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: MENU_MAX_HEIGHT,
        transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
      }}
      className="z-[60] min-w-[160px] overflow-y-auto rounded-lg border border-(--color-border-subtle) bg-(--color-surface) py-1 shadow-(--shadow-soft)"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-(--color-badge-bg) ${
              active ? 'font-semibold text-(--color-accent)' : 'text-(--color-text-primary)'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {active && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-w-[160px] cursor-pointer items-center justify-between gap-2 rounded-lg border border-(--color-border-subtle) bg-(--color-bg) px-3 py-2 text-xs font-semibold text-(--color-text-primary) transition hover:border-(--color-text-muted) focus:ring-2 focus:ring-(--color-accent)/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-(--color-text-muted) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && mounted && createPortal(menu, document.body)}
    </div>
  );
}
