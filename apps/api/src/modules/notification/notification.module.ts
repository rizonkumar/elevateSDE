import { Module } from '@nestjs/common';
import { INotificationRepository } from './domain/interfaces/notification-repository.interface';
import { INotificationPush } from './domain/interfaces/notification-push.interface';
import { RealtimeNotificationPush } from './infrastructure/realtime-notification-push';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NotificationService } from './application/notification.service';
import { NotificationListener } from './application/listeners/notification.listener';
import { NotificationController } from './presentation/controllers/notification.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationListener,
    PrismaService,
    {
      provide: INotificationRepository,
      useClass: NotificationRepository,
    },
    {
      provide: INotificationPush,
      useClass: RealtimeNotificationPush,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
