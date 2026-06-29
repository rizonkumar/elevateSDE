import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { INotificationRepository } from '../../domain/interfaces/notification-repository.interface';
import { Notification } from '../../domain/entities/notification';
import { NotificationPreferenceView } from '../../domain/read-models/notification-view';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(notification: Notification): Promise<void> {
    await this.prisma.notification.create({
      data: {
        id: notification.getId(),
        userId: notification.getUserId(),
        tenantId: notification.getTenantId(),
        type: notification.getType(),
        title: notification.getTitle(),
        body: notification.getBody(),
        linkUrl: notification.getLinkUrl(),
      },
    });
  }

  async listForUser(userId: string, limit: number): Promise<Notification[]> {
    const records = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map((record) => NotificationMapper.toDomain(record));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async listPreferences(userId: string): Promise<NotificationPreferenceView[]> {
    const records = await this.prisma.notificationPreference.findMany({ where: { userId } });
    return records.map((record) => ({ type: record.type, inAppEnabled: record.inAppEnabled }));
  }

  async findPreference(userId: string, type: NotificationType): Promise<boolean | null> {
    const record = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    return record ? record.inAppEnabled : null;
  }

  async upsertPreference(userId: string, type: NotificationType, inAppEnabled: boolean): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      update: { inAppEnabled },
      create: { userId, type, inAppEnabled },
    });
  }
}
