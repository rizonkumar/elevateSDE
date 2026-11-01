import { BadRequestException } from '@nestjs/common';
import { AssessmentDifficulty, ComparisonMode } from '@prisma/client';
import { ProblemProgressStatus } from '@elevatesde/shared-types';
import { Problem } from '../domain/entities/problem';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
  ProblemWriteInput,
} from '../domain/interfaces/problem-repository.interface';
import { ProblemService } from './problem.service';

const TOPIC_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_ID = '22222222-2222-4222-8222-222222222222';

function buildProblem(id: string): Problem {
  return Problem.reconstitute({
    id,
    tenantId: null,
    slug: id,
    title: `Problem ${id}`,
    difficulty: AssessmentDifficulty.EASY,
    description: '',
    constraints: [],
    tags: ['Array'],
    starterCode: { javascript: '', python: '', cpp: '' },
    examples: [],
    functionName: 'solve',
    harness: { paramTypes: [], returnType: '', cpp: { signature: '' } },
    referenceSolution: {},
    comparisonMode: ComparisonMode.EXACT,
    timeLimitMinutes: 30,
    isPublished: true,
    testCases: [],
    topics: [{ id: TOPIC_ID, slug: 'array', name: 'Array' }],
    companies: [{ id: COMPANY_ID, slug: 'amazon', name: 'Amazon', frequency: 70 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function writeInput(overrides: Partial<ProblemWriteInput> = {}): ProblemWriteInput {
  return {
    title: 'New',
    difficulty: AssessmentDifficulty.EASY,
    description: '',
    constraints: [],
    topicIds: [TOPIC_ID],
    companies: [{ companyId: COMPANY_ID, frequency: 50 }],
    starterCode: { javascript: '', python: '', cpp: '' },
    timeLimitMinutes: 30,
    isPublished: false,
    testCases: [],
    ...overrides,
  };
}

class FakeProblemRepository implements IProblemRepository {
  problems = new Map<string, Problem>([
    ['p1', buildProblem('p1')],
    ['p2', buildProblem('p2')],
  ]);
  statuses = new Map<string, ProblemProgressStatus>();
  knownTopics = new Set([TOPIC_ID]);
  knownCompanies = new Set([COMPANY_ID]);
  written: ProblemWriteInput | null = null;

  async findPublished(): Promise<ProblemListResult> {
    return { items: [...this.problems.values()], total: this.problems.size };
  }

  async findAll(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.findPublished().then((result) => ({ ...result, total: filter.pageSize }));
  }

  async findById(id: string): Promise<Problem | null> {
    return this.problems.get(id) ?? null;
  }

  async create(input: ProblemWriteInput): Promise<Problem> {
    this.written = input;
    return buildProblem('created');
  }

  async update(id: string, input: ProblemWriteInput): Promise<Problem> {
    this.written = input;
    return buildProblem(id);
  }

  async setPublished(id: string): Promise<Problem> {
    return buildProblem(id);
  }

  async delete(): Promise<void> {
    return;
  }

  async findViewerStatuses(): Promise<Map<string, ProblemProgressStatus>> {
    return this.statuses;
  }

  async countExistingTopics(topicIds: string[]): Promise<number> {
    return topicIds.filter((id) => this.knownTopics.has(id)).length;
  }

  async countExistingCompanies(companyIds: string[]): Promise<number> {
    return companyIds.filter((id) => this.knownCompanies.has(id)).length;
  }
}

describe('ProblemService', () => {
  let repository: FakeProblemRepository;
  let service: ProblemService;

  beforeEach(() => {
    repository = new FakeProblemRepository();
    service = new ProblemService(repository);
  });

  it('labels each listed problem with the viewer progress, defaulting to TODO', async () => {
    repository.statuses.set('p1', 'SOLVED');

    const page = await service.list({ viewerId: 'viewer', page: 1, pageSize: 20 });

    expect(page.items.map((item) => item.status)).toEqual(['SOLVED', 'TODO']);
  });

  it('removes duplicate topics before writing', async () => {
    await service.create(writeInput({ topicIds: [TOPIC_ID, TOPIC_ID] }));

    expect(repository.written?.topicIds).toEqual([TOPIC_ID]);
  });

  it('rejects unknown topics and companies', async () => {
    await expect(
      service.create(writeInput({ topicIds: ['33333333-3333-4333-8333-333333333333'] })),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(
        writeInput({
          companies: [{ companyId: '44444444-4444-4444-8444-444444444444', frequency: 10 }],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects the same company twice', async () => {
    await expect(
      service.create(
        writeInput({
          companies: [
            { companyId: COMPANY_ID, frequency: 10 },
            { companyId: COMPANY_ID, frequency: 90 },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps existing topics and companies when an update omits them', async () => {
    await service.update('p1', { title: 'Renamed' });

    expect(repository.written?.topicIds).toEqual([TOPIC_ID]);
    expect(repository.written?.companies).toEqual([{ companyId: COMPANY_ID, frequency: 70 }]);
  });
});
