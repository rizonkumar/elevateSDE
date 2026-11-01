import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { syncProblemTags } from '../../../../infrastructure/prisma/problem-tags';
import { ITaxonomyRepository } from '../../domain/interfaces/taxonomy-repository.interface';
import { TaxonomyKind, TaxonomyTerm } from '../../domain/entities/taxonomy-term';
import { CompanyProgressView, TaxonomyTermView } from '../../domain/read-models/taxonomy-views';

interface TermRecord {
  id: string;
  slug: string;
  name: string;
  _count: { problems: number };
}

const PUBLISHED_PROBLEM_COUNT = {
  _count: { select: { problems: { where: { problem: { isPublished: true } } } } },
} as const;

const ALL_PROBLEM_COUNT = { _count: { select: { problems: true } } } as const;

function toView(record: TermRecord): TaxonomyTermView {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    problemCount: record._count.problems,
  };
}

@Injectable()
export class TaxonomyRepository implements ITaxonomyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedTopics(): Promise<TaxonomyTermView[]> {
    const records = await this.prisma.topic.findMany({
      include: PUBLISHED_PROBLEM_COUNT,
      orderBy: { name: 'asc' },
    });
    return records.map(toView).filter((view) => view.problemCount > 0);
  }

  async listCompaniesWithProgress(viewerId: string): Promise<CompanyProgressView[]> {
    const records = await this.prisma.company.findMany({
      include: PUBLISHED_PROBLEM_COUNT,
      orderBy: { name: 'asc' },
    });
    const visible = records.map(toView).filter((view) => view.problemCount > 0);
    const solved = await this.solvedCountsByCompany(
      viewerId,
      visible.map((view) => view.id),
    );
    return visible.map((view) => ({ ...view, solvedCount: solved.get(view.id) ?? 0 }));
  }

  async findCompanyWithProgress(
    slug: string,
    viewerId: string,
  ): Promise<CompanyProgressView | null> {
    const record = await this.prisma.company.findUnique({
      where: { slug },
      include: PUBLISHED_PROBLEM_COUNT,
    });
    if (!record) {
      return null;
    }
    const solved = await this.solvedCountsByCompany(viewerId, [record.id]);
    return { ...toView(record), solvedCount: solved.get(record.id) ?? 0 };
  }

  async listForAdmin(kind: TaxonomyKind): Promise<TaxonomyTermView[]> {
    const records =
      kind === 'topic'
        ? await this.prisma.topic.findMany({ include: ALL_PROBLEM_COUNT, orderBy: { name: 'asc' } })
        : await this.prisma.company.findMany({
            include: ALL_PROBLEM_COUNT,
            orderBy: { name: 'asc' },
          });
    return records.map(toView);
  }

  async exists(kind: TaxonomyKind, id: string): Promise<boolean> {
    const count =
      kind === 'topic'
        ? await this.prisma.topic.count({ where: { id } })
        : await this.prisma.company.count({ where: { id } });
    return count > 0;
  }

  async create(kind: TaxonomyKind, term: TaxonomyTerm): Promise<TaxonomyTermView> {
    const data = { name: term.getName(), slug: term.getSlug() };
    const record =
      kind === 'topic'
        ? await this.prisma.topic.create({ data, include: ALL_PROBLEM_COUNT })
        : await this.prisma.company.create({ data, include: ALL_PROBLEM_COUNT });
    return toView(record);
  }

  async rename(kind: TaxonomyKind, id: string, term: TaxonomyTerm): Promise<TaxonomyTermView> {
    const data = { name: term.getName(), slug: term.getSlug() };
    if (kind === 'company') {
      return toView(
        await this.prisma.company.update({ where: { id }, data, include: ALL_PROBLEM_COUNT }),
      );
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.topic.update({ where: { id }, data, include: ALL_PROBLEM_COUNT });
      const links = await tx.problemTopic.findMany({
        where: { topicId: id },
        select: { problemId: true },
      });
      await syncProblemTags(
        tx,
        links.map((link) => link.problemId),
      );
      return updated;
    });
    return toView(record);
  }

  async delete(kind: TaxonomyKind, id: string): Promise<void> {
    if (kind === 'company') {
      await this.prisma.company.delete({ where: { id } });
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      const links = await tx.problemTopic.findMany({
        where: { topicId: id },
        select: { problemId: true },
      });
      await tx.topic.delete({ where: { id } });
      await syncProblemTags(
        tx,
        links.map((link) => link.problemId),
      );
    });
  }

  private async solvedCountsByCompany(
    viewerId: string,
    companyIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (companyIds.length === 0) {
      return counts;
    }
    const grouped = await this.prisma.problemCompany.groupBy({
      by: ['companyId'],
      where: {
        companyId: { in: companyIds },
        problem: {
          isPublished: true,
          submissions: { some: { userId: viewerId, status: SubmissionStatus.ACCEPTED } },
        },
      },
      _count: { _all: true },
    });
    for (const row of grouped) {
      counts.set(row.companyId, row._count._all);
    }
    return counts;
  }
}
