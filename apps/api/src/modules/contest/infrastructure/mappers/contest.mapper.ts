import { Contest as PrismaContest } from '@prisma/client';
import { Contest } from '../../domain/entities/contest';

export class ContestMapper {
  static toDomain(record: PrismaContest): Contest {
    return Contest.reconstitute({
      id: record.id,
      slug: record.slug,
      title: record.title,
      description: record.description,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      status: record.status,
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(
    contest: Contest,
  ): Pick<
    PrismaContest,
    'id' | 'slug' | 'title' | 'description' | 'startsAt' | 'endsAt' | 'status' | 'tenantId'
  > {
    return {
      id: contest.getId(),
      slug: contest.getSlug(),
      title: contest.getTitle(),
      description: contest.getDescription(),
      startsAt: contest.getStartsAt(),
      endsAt: contest.getEndsAt(),
      status: contest.getStatus(),
      tenantId: contest.getTenantId(),
    };
  }
}
