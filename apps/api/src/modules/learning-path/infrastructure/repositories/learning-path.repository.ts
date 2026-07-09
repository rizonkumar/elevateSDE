import { Injectable } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ILearningPathRepository } from '../../domain/interfaces/learning-path-repository.interface';
import { LearningPath } from '../../domain/entities/learning-path';
import {
  ItemRef,
  LearningPathCardData,
  LearningPathDetailData,
  LearningPathSummaryData,
  ModuleRef,
  PublishedProblemRef,
} from '../../domain/read-models/learning-path-view';
import { LearningPathMapper } from '../mappers/learning-path.mapper';

const DETAIL_INCLUDE = {
  modules: {
    orderBy: { order: 'asc' },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: { problem: { select: { title: true, difficulty: true } } },
      },
    },
  },
} satisfies Prisma.LearningPathInclude;

type DetailRow = Prisma.LearningPathGetPayload<{ include: typeof DETAIL_INCLUDE }>;

@Injectable()
export class LearningPathRepository implements ILearningPathRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<LearningPathSummaryData[]> {
    const rows = await this.prisma.learningPath.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { modules: true } },
        modules: { select: { _count: { select: { items: true } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      level: row.level,
      moduleCount: row._count.modules,
      problemCount: row.modules.reduce((sum, mod) => sum + mod._count.items, 0),
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findAdminDetail(id: string): Promise<LearningPathDetailData | null> {
    const row = await this.prisma.learningPath.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    return row ? this.toDetailData(row) : null;
  }

  async findById(id: string): Promise<LearningPath | null> {
    const record = await this.prisma.learningPath.findUnique({ where: { id } });
    return record ? LearningPathMapper.toDomain(record) : null;
  }

  async findIdBySlug(slug: string): Promise<string | null> {
    const record = await this.prisma.learningPath.findUnique({
      where: { slug },
      select: { id: true },
    });
    return record?.id ?? null;
  }

  async create(path: LearningPath): Promise<void> {
    await this.prisma.learningPath.create({ data: LearningPathMapper.toPersistence(path) });
  }

  async update(path: LearningPath): Promise<void> {
    const data = LearningPathMapper.toPersistence(path);
    await this.prisma.learningPath.update({ where: { id: data.id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.learningPath.delete({ where: { id } });
  }

  async countModules(pathId: string): Promise<number> {
    return this.prisma.learningPathModule.count({ where: { pathId } });
  }

  async countItems(pathId: string): Promise<number> {
    return this.prisma.learningPathItem.count({ where: { module: { pathId } } });
  }

  async findPublishedCards(tenantId: string | null): Promise<LearningPathCardData[]> {
    const rows = await this.prisma.learningPath.findMany({
      where: { isPublished: true, ...this.tenantScope(tenantId) },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { modules: true } },
        modules: { select: { items: { select: { problemId: true } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      level: row.level,
      tags: row.tags,
      coverImage: row.coverImage,
      moduleCount: row._count.modules,
      problemIds: row.modules.flatMap((mod) => mod.items.map((item) => item.problemId)),
    }));
  }

  async findPublishedDetailBySlug(
    slug: string,
    tenantId: string | null,
  ): Promise<LearningPathDetailData | null> {
    const row = await this.prisma.learningPath.findFirst({
      where: { slug, isPublished: true, ...this.tenantScope(tenantId) },
      include: DETAIL_INCLUDE,
    });
    return row ? this.toDetailData(row) : null;
  }

  async findVisiblePublishedId(id: string, tenantId: string | null): Promise<string | null> {
    const record = await this.prisma.learningPath.findFirst({
      where: { id, isPublished: true, ...this.tenantScope(tenantId) },
      select: { id: true },
    });
    return record?.id ?? null;
  }

  async findAcceptedProblemIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.submission.findMany({
      where: { userId, status: SubmissionStatus.ACCEPTED },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    return rows.map((row) => row.problemId);
  }

  async findEnrolledPathIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.pathEnrollment.findMany({
      where: { userId },
      select: { pathId: true },
    });
    return rows.map((row) => row.pathId);
  }

  async isEnrolled(userId: string, pathId: string): Promise<boolean> {
    const record = await this.prisma.pathEnrollment.findUnique({
      where: { userId_pathId: { userId, pathId } },
      select: { id: true },
    });
    return record !== null;
  }

  async enroll(userId: string, pathId: string): Promise<void> {
    await this.prisma.pathEnrollment.upsert({
      where: { userId_pathId: { userId, pathId } },
      update: {},
      create: { userId, pathId },
    });
  }

  async findModule(moduleId: string): Promise<ModuleRef | null> {
    const record = await this.prisma.learningPathModule.findUnique({
      where: { id: moduleId },
      select: { id: true, pathId: true, order: true },
    });
    return record ?? null;
  }

  async getMaxModuleOrder(pathId: string): Promise<number> {
    const result = await this.prisma.learningPathModule.aggregate({
      where: { pathId },
      _max: { order: true },
    });
    return result._max.order ?? -1;
  }

  async createModule(pathId: string, title: string, order: number): Promise<void> {
    await this.prisma.learningPathModule.create({ data: { pathId, title, order } });
  }

  async renameModule(moduleId: string, title: string): Promise<void> {
    await this.prisma.learningPathModule.update({ where: { id: moduleId }, data: { title } });
  }

  async removeModule(moduleId: string): Promise<void> {
    await this.prisma.learningPathModule.delete({ where: { id: moduleId } });
  }

  async swapModuleOrder(
    firstId: string,
    firstOrder: number,
    secondId: string,
    secondOrder: number,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.learningPathModule.update({
        where: { id: firstId },
        data: { order: secondOrder },
      }),
      this.prisma.learningPathModule.update({
        where: { id: secondId },
        data: { order: firstOrder },
      }),
    ]);
  }

  async findItem(itemId: string): Promise<ItemRef | null> {
    const record = await this.prisma.learningPathItem.findUnique({
      where: { id: itemId },
      select: { id: true, moduleId: true, order: true, module: { select: { pathId: true } } },
    });
    if (!record) {
      return null;
    }
    return {
      id: record.id,
      moduleId: record.moduleId,
      pathId: record.module.pathId,
      order: record.order,
    };
  }

  async getMaxItemOrder(moduleId: string): Promise<number> {
    const result = await this.prisma.learningPathItem.aggregate({
      where: { moduleId },
      _max: { order: true },
    });
    return result._max.order ?? -1;
  }

  async findPublishedProblem(problemId: string): Promise<PublishedProblemRef | null> {
    const record = await this.prisma.problem.findFirst({
      where: { id: problemId, isPublished: true },
      select: { id: true, title: true, difficulty: true },
    });
    return record ?? null;
  }

  async itemExists(moduleId: string, problemId: string): Promise<boolean> {
    const record = await this.prisma.learningPathItem.findUnique({
      where: { moduleId_problemId: { moduleId, problemId } },
      select: { id: true },
    });
    return record !== null;
  }

  async createItem(moduleId: string, problemId: string, order: number): Promise<void> {
    await this.prisma.learningPathItem.create({ data: { moduleId, problemId, order } });
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.learningPathItem.delete({ where: { id: itemId } });
  }

  async swapItemOrder(
    firstId: string,
    firstOrder: number,
    secondId: string,
    secondOrder: number,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.learningPathItem.update({
        where: { id: firstId },
        data: { order: secondOrder },
      }),
      this.prisma.learningPathItem.update({
        where: { id: secondId },
        data: { order: firstOrder },
      }),
    ]);
  }

  private tenantScope(tenantId: string | null): Prisma.LearningPathWhereInput {
    if (tenantId === null) {
      return { tenantId: null };
    }
    return { OR: [{ tenantId: null }, { tenantId }] };
  }

  private toDetailData(row: DetailRow): LearningPathDetailData {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      level: row.level,
      tags: row.tags,
      coverImage: row.coverImage,
      isPublished: row.isPublished,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      modules: row.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        order: mod.order,
        items: mod.items.map((item) => ({
          id: item.id,
          problemId: item.problemId,
          title: item.problem.title,
          difficulty: item.problem.difficulty,
          order: item.order,
        })),
      })),
    };
  }
}
