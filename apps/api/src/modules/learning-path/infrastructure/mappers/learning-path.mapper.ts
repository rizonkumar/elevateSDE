import { LearningPath as PrismaLearningPath } from '@prisma/client';
import { LearningPath } from '../../domain/entities/learning-path';

export class LearningPathMapper {
  static toDomain(record: PrismaLearningPath): LearningPath {
    return LearningPath.reconstitute({
      id: record.id,
      slug: record.slug,
      title: record.title,
      description: record.description,
      level: record.level,
      tags: record.tags,
      coverImage: record.coverImage,
      isPublished: record.isPublished,
      tenantId: record.tenantId,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(
    path: LearningPath,
  ): Pick<
    PrismaLearningPath,
    | 'id'
    | 'slug'
    | 'title'
    | 'description'
    | 'level'
    | 'tags'
    | 'coverImage'
    | 'isPublished'
    | 'tenantId'
    | 'order'
  > {
    return {
      id: path.getId(),
      slug: path.getSlug(),
      title: path.getTitle(),
      description: path.getDescription(),
      level: path.getLevel(),
      tags: path.getTags(),
      coverImage: path.getCoverImage(),
      isPublished: path.isPathPublished(),
      tenantId: path.getTenantId(),
      order: path.getOrder(),
    };
  }
}
