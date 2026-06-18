'use client';

import * as React from 'react';

export type ThemeMode = 'light' | 'dark';

export function useThemeMode(): ThemeMode {
  const [mode, setMode] = React.useState<ThemeMode>('dark');

  React.useEffect(() => {
    const read = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') {
        setMode(attr);
        return;
      }
      setMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);

  return mode;
}
