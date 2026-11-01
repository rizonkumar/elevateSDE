import { Injectable } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { ProblemProgressStatus } from '@elevatesde/shared-types';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
  ProblemWriteInput,
} from '../../domain/interfaces/problem-repository.interface';
import { Problem } from '../../domain/entities/problem';
import { ProblemMapper } from '../mappers/problem.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { syncProblemTags } from '../../../../infrastructure/prisma/problem-tags';

function problemInclude(withTestCases: boolean) {
  return {
    topics: { include: { topic: true } },
    companies: { include: { company: true } },
    testCases: { orderBy: { ordinal: 'asc' }, take: withTestCases ? undefined : 0 },
  } satisfies Prisma.ProblemInclude;
}

const DETAIL_INCLUDE = problemInclude(true);

const DEFAULT_ORDER: Prisma.ProblemOrderByWithRelationInput[] = [
  { difficulty: 'asc' },
  { title: 'asc' },
];

const EMPTY_HARNESS = { paramTypes: [], returnType: '', cpp: { signature: '' } };

const toSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'problem';

const toFunctionName = (title: string): string => {
  const words = title
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return 'solution';
  }
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
};

const toTestCaseCreate = (
  input: ProblemWriteInput,
): Prisma.ProblemTestCaseCreateWithoutProblemInput[] =>
  input.testCases.map((testCase, index) => ({
    ordinal: index + 1,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    isHidden: testCase.isHidden,
  }));

const toScalarData = (input: ProblemWriteInput) => ({
  title: input.title,
  difficulty: input.difficulty,
  description: input.description,
  constraints: input.constraints,
  starterCode: input.starterCode as unknown as Prisma.InputJsonValue,
  timeLimitMinutes: input.timeLimitMinutes,
  isPublished: input.isPublished,
});

@Injectable()
export class ProblemRepository implements IProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: ProblemListFilter, publishedOnly: boolean): Prisma.ProblemWhereInput {
    const conditions: Prisma.ProblemWhereInput[] = [];
    if (publishedOnly) {
      conditions.push({ isPublished: true });
    }
    if (filter.difficulty) {
      conditions.push({ difficulty: filter.difficulty });
    }
    if (filter.topics && filter.topics.length > 0) {
      conditions.push({ topics: { some: { topic: { slug: { in: filter.topics } } } } });
    }
    if (filter.company) {
      conditions.push({ companies: { some: { company: { slug: filter.company } } } });
    }
    if (filter.search) {
      conditions.push({ title: { contains: filter.search, mode: 'insensitive' } });
    }
    if (filter.hasTestCases) {
      conditions.push({ testCases: { some: {} } });
    }
    if (filter.status && filter.viewerId) {
      conditions.push(statusCondition(filter.status, filter.viewerId));
    }
    return { AND: conditions };
  }

  private async paginate(
    where: Prisma.ProblemWhereInput,
    filter: ProblemListFilter,
    withTestCases: boolean,
  ): Promise<ProblemListResult> {
    const include = problemInclude(withTestCases);
    if (filter.company) {
      return this.paginateByCompanyFrequency(where, filter, withTestCases);
    }
    const [records, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        include,
        orderBy: DEFAULT_ORDER,
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.problem.count({ where }),
    ]);
    return { items: records.map((record) => ProblemMapper.toDomain(record)), total };
  }

  private async paginateByCompanyFrequency(
    where: Prisma.ProblemWhereInput,
    filter: ProblemListFilter,
    withTestCases: boolean,
  ): Promise<ProblemListResult> {
    const include = problemInclude(withTestCases);
    const linkWhere: Prisma.ProblemCompanyWhereInput = {
      company: { slug: filter.company },
      problem: where,
    };
    const [links, total] = await Promise.all([
      this.prisma.problemCompany.findMany({
        where: linkWhere,
        orderBy: [{ frequency: 'desc' }, { problem: { title: 'asc' } }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        include: { problem: { include } },
      }),
      this.prisma.problemCompany.count({ where: linkWhere }),
    ]);
    return { items: links.map((link) => ProblemMapper.toDomain(link.problem)), total };
  }

  async findPublished(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.paginate(this.buildWhere(filter, true), filter, false);
  }

  async findAll(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.paginate(this.buildWhere(filter, false), filter, true);
  }

  async findById(id: string): Promise<Problem | null> {
    const record = await this.prisma.problem.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!record) {
      return null;
    }
    return ProblemMapper.toDomain(record);
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = toSlug(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.problem.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(input: ProblemWriteInput): Promise<Problem> {
    const slug = await this.generateUniqueSlug(input.title);
    const id = await this.prisma.$transaction(async (tx) => {
      const created = await tx.problem.create({
        data: {
          ...toScalarData(input),
          slug,
          examples: [],
          functionName: toFunctionName(input.title),
          harness: EMPTY_HARNESS,
          referenceSolution: {},
          testCases: { create: toTestCaseCreate(input) },
          topics: { create: toTopicLinks(input) },
          companies: { create: toCompanyLinks(input) },
        },
        select: { id: true },
      });
      await syncProblemTags(tx, [created.id]);
      return created.id;
    });
    return this.requireById(id);
  }

  async update(id: string, input: ProblemWriteInput): Promise<Problem> {
    await this.prisma.$transaction(async (tx) => {
      await tx.problem.update({
        where: { id },
        data: {
          ...toScalarData(input),
          testCases: { deleteMany: {}, create: toTestCaseCreate(input) },
          topics: { deleteMany: {}, create: toTopicLinks(input) },
          companies: { deleteMany: {}, create: toCompanyLinks(input) },
        },
        select: { id: true },
      });
      await syncProblemTags(tx, [id]);
    });
    return this.requireById(id);
  }

  async setPublished(id: string, isPublished: boolean): Promise<Problem> {
    const updated = await this.prisma.problem.update({
      where: { id },
      data: { isPublished },
      include: DETAIL_INCLUDE,
    });
    return ProblemMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.problem.delete({ where: { id } });
  }

  async findViewerStatuses(
    viewerId: string,
    problemIds: string[],
  ): Promise<Map<string, ProblemProgressStatus>> {
    const statuses = new Map<string, ProblemProgressStatus>();
    if (problemIds.length === 0) {
      return statuses;
    }
    const grouped = await this.prisma.submission.groupBy({
      by: ['problemId', 'status'],
      where: { userId: viewerId, problemId: { in: problemIds } },
    });
    for (const row of grouped) {
      if (row.status === SubmissionStatus.ACCEPTED) {
        statuses.set(row.problemId, 'SOLVED');
      } else if (!statuses.has(row.problemId)) {
        statuses.set(row.problemId, 'ATTEMPTED');
      }
    }
    return statuses;
  }

  async countExistingTopics(topicIds: string[]): Promise<number> {
    if (topicIds.length === 0) {
      return 0;
    }
    return this.prisma.topic.count({ where: { id: { in: topicIds } } });
  }

  async countExistingCompanies(companyIds: string[]): Promise<number> {
    if (companyIds.length === 0) {
      return 0;
    }
    return this.prisma.company.count({ where: { id: { in: companyIds } } });
  }

  private async requireById(id: string): Promise<Problem> {
    const problem = await this.findById(id);
    if (!problem) {
      throw new Error(`Problem ${id} disappeared after being written`);
    }
    return problem;
  }
}

function toTopicLinks(input: ProblemWriteInput): Prisma.ProblemTopicCreateWithoutProblemInput[] {
  return input.topicIds.map((topicId) => ({ topic: { connect: { id: topicId } } }));
}

function toCompanyLinks(
  input: ProblemWriteInput,
): Prisma.ProblemCompanyCreateWithoutProblemInput[] {
  return input.companies.map((company) => ({
    frequency: company.frequency,
    company: { connect: { id: company.companyId } },
  }));
}

function statusCondition(
  status: ProblemProgressStatus,
  viewerId: string,
): Prisma.ProblemWhereInput {
  const accepted: Prisma.SubmissionWhereInput = {
    userId: viewerId,
    status: SubmissionStatus.ACCEPTED,
  };
  if (status === 'SOLVED') {
    return { submissions: { some: accepted } };
  }
  if (status === 'ATTEMPTED') {
    return {
      AND: [{ submissions: { some: { userId: viewerId } } }, { submissions: { none: accepted } }],
    };
  }
  return { submissions: { none: { userId: viewerId } } };
}
