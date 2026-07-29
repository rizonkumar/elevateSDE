import { ContestStatus } from '@prisma/client';
import { deriveContestStatus } from './contest-status';

const STARTS_AT = new Date('2026-08-01T10:00:00.000Z');
const ENDS_AT = new Date('2026-08-01T12:00:00.000Z');

describe('deriveContestStatus', () => {
  it('keeps a draft contest in draft regardless of the window', () => {
    expect(
      deriveContestStatus(ContestStatus.DRAFT, STARTS_AT, ENDS_AT, new Date(ENDS_AT.getTime())),
    ).toBe(ContestStatus.DRAFT);
  });

  it('is scheduled before the start', () => {
    expect(
      deriveContestStatus(
        ContestStatus.SCHEDULED,
        STARTS_AT,
        ENDS_AT,
        new Date('2026-08-01T09:59:59.999Z'),
      ),
    ).toBe(ContestStatus.SCHEDULED);
  });

  it('goes live exactly at the start boundary', () => {
    expect(deriveContestStatus(ContestStatus.SCHEDULED, STARTS_AT, ENDS_AT, STARTS_AT)).toBe(
      ContestStatus.LIVE,
    );
  });

  it('ends exactly at the end boundary', () => {
    expect(deriveContestStatus(ContestStatus.LIVE, STARTS_AT, ENDS_AT, ENDS_AT)).toBe(
      ContestStatus.ENDED,
    );
  });

  it('stays ended after the window', () => {
    expect(
      deriveContestStatus(
        ContestStatus.ENDED,
        STARTS_AT,
        ENDS_AT,
        new Date('2026-08-02T00:00:00.000Z'),
      ),
    ).toBe(ContestStatus.ENDED);
  });
});
