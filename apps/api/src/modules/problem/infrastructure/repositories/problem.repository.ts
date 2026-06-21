import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
} from '../../domain/interfaces/problem-repository.interface';
import { Problem } from '../../domain/entities/problem';
import { ProblemMapper } from '../mappers/problem.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class ProblemRepository implements IProblemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(filter: ProblemListFilter): Promise<ProblemListResult> {
    const where: Prisma.ProblemWhereInput = { isPublished: true };
    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }
    if (filter.tag) {
      where.tags = { has: filter.tag };
    }
    if (filter.search) {
      where.title = { contains: filter.search, mode: 'insensitive' };
    }

    const [records, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.problem.count({ where }),
    ]);

    return {
      items: records.map((record) => ProblemMapper.toDomain(record)),
      total,
    };
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
}
