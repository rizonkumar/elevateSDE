'use client';

import * as React from 'react';

interface NumberedCodeProps {
  code: string;
  highlightedLines: ReadonlySet<number>;
  focusedLine: number | null;
  idPrefix: string;
}

export function codeLineId(idPrefix: string, line: number): string {
  return `${idPrefix}-line-${line}`;
}

export function NumberedCode({
  code,
  highlightedLines,
  focusedLine,
  idPrefix,
}: Readonly<NumberedCodeProps>) {
  const lines = code.split('\n');
  return (
    <div className="max-h-96 overflow-auto rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-bg-soft) py-3 font-mono text-xs leading-relaxed">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((text, index) => {
            const line = index + 1;
            const highlighted = highlightedLines.has(line);
            const focused = focusedLine === line;
            let rowTone = '';
            if (focused) rowTone = 'bg-(--color-accent-soft)';
            else if (highlighted) rowTone = 'bg-(--color-warning-soft)';
            return (
              <tr key={line} id={codeLineId(idPrefix, line)} className={`scroll-mt-12 ${rowTone}`}>
                <td className="w-10 select-none pr-3 text-right align-top text-(--color-text-muted)">
                  {line}
                </td>
                <td className="whitespace-pre pr-4 text-(--color-text-primary)">{text || ' '}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
