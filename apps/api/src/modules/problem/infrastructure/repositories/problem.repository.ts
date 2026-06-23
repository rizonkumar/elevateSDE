import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
  ProblemWriteInput,
} from '../../domain/interfaces/problem-repository.interface';
import { Problem } from '../../domain/entities/problem';
import { ProblemMapper } from '../mappers/problem.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

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
  tags: input.tags,
  starterCode: input.starterCode as unknown as Prisma.InputJsonValue,
  timeLimitMinutes: input.timeLimitMinutes,
  isPublished: input.isPublished,
});

@Injectable()
export class ProblemRepository implements IProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(filter: ProblemListFilter, publishedOnly: boolean): Prisma.ProblemWhereInput {
    const where: Prisma.ProblemWhereInput = {};
    if (publishedOnly) {
      where.isPublished = true;
    }
    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }
    if (filter.tag) {
      where.tags = { has: filter.tag };
    }
    if (filter.search) {
      where.title = { contains: filter.search, mode: 'insensitive' };
    }
    return where;
  }

  private async paginate(
    where: Prisma.ProblemWhereInput,
    filter: ProblemListFilter,
    include?: Prisma.ProblemInclude,
  ): Promise<ProblemListResult> {
    const [records, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        include,
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.problem.count({ where }),
    ]);
    return { items: records.map((record) => ProblemMapper.toDomain(record)), total };
  }

  async findPublished(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.paginate(this.buildWhere(filter, true), filter);
  }

  async findAll(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.paginate(this.buildWhere(filter, false), filter, {
      testCases: { orderBy: { ordinal: 'asc' } },
    });
  }

  async findById(id: string): Promise<Problem | null> {
    const record = await this.prisma.problem.findUnique({
      where: { id },
      include: { testCases: { orderBy: { ordinal: 'asc' } } },
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
    const created = await this.prisma.problem.create({
      data: {
        ...toScalarData(input),
        slug: await this.generateUniqueSlug(input.title),
        examples: [],
        functionName: toFunctionName(input.title),
        harness: EMPTY_HARNESS,
        referenceSolution: {},
        testCases: { create: toTestCaseCreate(input) },
      },
      include: { testCases: { orderBy: { ordinal: 'asc' } } },
    });
    return ProblemMapper.toDomain(created);
  }

  async update(id: string, input: ProblemWriteInput): Promise<Problem> {
    const updated = await this.prisma.problem.update({
      where: { id },
      data: {
        ...toScalarData(input),
        testCases: { deleteMany: {}, create: toTestCaseCreate(input) },
      },
      include: { testCases: { orderBy: { ordinal: 'asc' } } },
    });
    return ProblemMapper.toDomain(updated);
  }

  async setPublished(id: string, isPublished: boolean): Promise<Problem> {
    const updated = await this.prisma.problem.update({
      where: { id },
      data: { isPublished },
      include: { testCases: { orderBy: { ordinal: 'asc' } } },
    });
    return ProblemMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.problem.delete({ where: { id } });
  }
}
