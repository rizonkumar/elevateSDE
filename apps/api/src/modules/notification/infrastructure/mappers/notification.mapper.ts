import { Notification as PrismaNotification } from '@prisma/client';
import { Notification } from '../../domain/entities/notification';

export class NotificationMapper {
  static toDomain(record: PrismaNotification): Notification {
    return Notification.reconstitute({
      id: record.id,
      userId: record.userId,
      tenantId: record.tenantId,
      type: record.type,
      title: record.title,
      body: record.body,
      linkUrl: record.linkUrl,
      readAt: record.readAt,
      createdAt: record.createdAt,
    });
  }
}
