import { describeHandleProblem, handleFormatProblem, normalizeHandle } from './handle-policy';

describe('handle policy', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(normalizeHandle('  Ada-Lovelace ')).toBe('ada-lovelace');
  });

  it.each(['ada', 'ada-lovelace', 'a1b', 'x'.repeat(30), 'dev-2026'])('accepts %s', (handle) => {
    expect(handleFormatProblem(handle)).toBeNull();
  });

  it.each([
    'ab',
    'x'.repeat(31),
    '-ada',
    'ada-',
    'ada--lovelace',
    'ada_lovelace',
    'ada.lovelace',
    'Ada',
    'ada lovelace',
    '',
  ])('rejects %s as invalid', (handle) => {
    expect(handleFormatProblem(handle)).toBe('INVALID');
  });

  it.each(['admin', 'api', 'settings', 'dashboard', 'support', 'login'])(
    'rejects reserved handle %s',
    (handle) => {
      expect(handleFormatProblem(handle)).toBe('RESERVED');
    },
  );

  it('describes every problem', () => {
    expect(describeHandleProblem('TAKEN')).toMatch(/taken/);
    expect(describeHandleProblem('RESERVED')).toMatch(/reserved/);
    expect(describeHandleProblem('INVALID')).toMatch(/3 to 30/);
  });
});
