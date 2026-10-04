import { isSchedulerEnabled } from './scheduler-config';

describe('isSchedulerEnabled', () => {
  it.each([
    [undefined, true],
    ['true', true],
    ['', true],
    ['false', false],
    [' FALSE ', false],
  ])('treats %p as enabled=%p', (value, expected) => {
    expect(isSchedulerEnabled({ SCHEDULER_ENABLED: value })).toBe(expected);
  });
});
