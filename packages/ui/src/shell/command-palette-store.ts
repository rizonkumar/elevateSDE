import * as React from 'react';

const listeners = new Set<() => void>();
let isOpen = false;

function setOpenState(next: boolean) {
  if (isOpen === next) return;
  isOpen = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return isOpen;
}

function getServerSnapshot(): boolean {
  return false;
}

export function openCommandPalette() {
  setOpenState(true);
}

export function closeCommandPalette() {
  setOpenState(false);
}

export function useCommandPalette() {
  const open = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { open, openPalette: openCommandPalette, closePalette: closeCommandPalette };
}

export function useCommandPaletteHotkey() {
  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpenState(!isOpen);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);
}
