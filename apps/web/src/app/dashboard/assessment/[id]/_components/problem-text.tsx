import * as React from 'react';

export interface KeyedText {
  key: string;
  value: string;
}

export function toKeyed(items: string[]): KeyedText[] {
  const counts = new Map<string, number>();
  return items.map((value) => {
    const seen = counts.get(value) ?? 0;
    counts.set(value, seen + 1);
    return { key: `${value}#${seen}`, value };
  });
}

export function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const counts = new Map<string, number>();
  return text.split('`').map((part, index) => {
    const isCode = index % 2 === 1;
    const tag = isCode ? 'code' : 'text';
    const occurrence = counts.get(`${tag}:${part}`) ?? 0;
    counts.set(`${tag}:${part}`, occurrence + 1);
    const key = `${keyPrefix}-${tag}-${part}#${occurrence}`;
    return isCode ? (
      <code
        key={key}
        className="rounded bg-(--color-badge-bg) px-1.5 py-0.5 font-mono text-[0.85em] text-(--color-text-primary)"
      >
        {part}
      </code>
    ) : (
      <React.Fragment key={key}>{part}</React.Fragment>
    );
  });
}

export function ParagraphText({ text }: Readonly<{ text: string }>) {
  const lines = toKeyed(text.split('\n'));
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map(({ key, value }) =>
        value.trim().length === 0 ? (
          <div key={key} className="h-1" />
        ) : (
          <p key={key} className="m-0 text-(--color-text-primary)/85">
            {renderInline(value, key)}
          </p>
        ),
      )}
    </div>
  );
}
