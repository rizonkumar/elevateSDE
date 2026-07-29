import { ContestStatus } from '@prisma/client';
import { ContestService } from './contest.service';
import { deriveContestStatus } from '../domain/contest-status';
import {
  ContestStatusTransitionResult,
  IContestRepository,
} from '../domain/interfaces/contest-repository.interface';

interface StoredContest {
  id: string;
  status: ContestStatus;
  startsAt: Date;
  endsAt: Date;
}

const STARTS_AT = new Date('2026-08-01T10:00:00.000Z');
const ENDS_AT = new Date('2026-08-01T12:00:00.000Z');

function buildRows(): StoredContest[] {
  return [
    { id: 'draft', status: ContestStatus.DRAFT, startsAt: STARTS_AT, endsAt: ENDS_AT },
    { id: 'published', status: ContestStatus.SCHEDULED, startsAt: STARTS_AT, endsAt: ENDS_AT },
  ];
}

class FakeContestRepository implements Partial<IContestRepository> {
  constructor(readonly rows: StoredContest[]) {}

  async applyStatusTransitions(now: Date): Promise<ContestStatusTransitionResult> {
    let toEnded = 0;
    let toLive = 0;
    for (const row of this.rows) {
      const eligible =
        row.status === ContestStatus.SCHEDULED || row.status === ContestStatus.LIVE;
      if (eligible && row.endsAt <= now) {
        row.status = ContestStatus.ENDED;
        toEnded += 1;
        continue;
      }
      if (row.status === ContestStatus.SCHEDULED && row.startsAt <= now && row.endsAt > now) {
        row.status = ContestStatus.LIVE;
        toLive += 1;
      }
    }
    return { toLive, toEnded };
  }
}

function buildService(rows: StoredContest[]): ContestService {
  const repository = new FakeContestRepository(rows) as unknown as IContestRepository;
  return new ContestService(repository);
}

describe('ContestService.syncStatuses', () => {
  const instants = [
    new Date('2026-08-01T09:00:00.000Z'),
    STARTS_AT,
    new Date('2026-08-01T11:00:00.000Z'),
    ENDS_AT,
    new Date('2026-08-02T00:00:00.000Z'),
  ];

  it.each(instants)('persists the same status the read path derives at %s', async (now) => {
    const rows = buildRows();
    const expected = rows.map((row) =>
      deriveContestStatus(row.status, row.startsAt, row.endsAt, now),
    );

    await buildService(rows).syncStatuses(now);

    expect(rows.map((row) => row.status)).toEqual(expected);
  });

  it('never touches a draft contest', async () => {
    const rows = buildRows();

    await buildService(rows).syncStatuses(new Date('2026-08-02T00:00:00.000Z'));

    expect(rows.find((row) => row.id === 'draft')?.status).toBe(ContestStatus.DRAFT);
  });

  it('reports how many contests moved in each direction', async () => {
    const rows = buildRows();

    const result = await buildService(rows).syncStatuses(STARTS_AT);

    expect(result).toEqual({ toLive: 1, toEnded: 0 });
  });

  it('ends a contest that is already live once the window closes', async () => {
    const rows: StoredContest[] = [
      { id: 'running', status: ContestStatus.LIVE, startsAt: STARTS_AT, endsAt: ENDS_AT },
    ];

    const result = await buildService(rows).syncStatuses(ENDS_AT);

    expect(rows[0]?.status).toBe(ContestStatus.ENDED);
    expect(result).toEqual({ toLive: 0, toEnded: 1 });
  });

  it('is idempotent across repeated sweeps at the same instant', async () => {
    const rows = buildRows();
    const service = buildService(rows);

    await service.syncStatuses(STARTS_AT);
    const second = await service.syncStatuses(STARTS_AT);

    expect(second).toEqual({ toLive: 0, toEnded: 0 });
    expect(rows.find((row) => row.id === 'published')?.status).toBe(ContestStatus.LIVE);
  });

  it('moves a scheduled contest straight to ended when the whole window has passed', async () => {
    const rows = buildRows();

    const result = await buildService(rows).syncStatuses(new Date('2026-08-02T00:00:00.000Z'));

    expect(rows.find((row) => row.id === 'published')?.status).toBe(ContestStatus.ENDED);
    expect(result).toEqual({ toLive: 0, toEnded: 1 });
  });
});
