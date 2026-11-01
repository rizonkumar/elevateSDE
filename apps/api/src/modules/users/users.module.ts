import { Module } from '@nestjs/common';
import { IUsersRepository } from './domain/interfaces/users-repository.interface';
import { UsersRepository } from './infrastructure/repositories/users.repository';
import { UsersService } from './application/users.service';
import { AccountReviewService } from './application/account-review.service';
import { UsersController } from './presentation/controllers/users.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    AccountReviewService,
    PrismaService,
    {
      provide: IUsersRepository,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService, AccountReviewService],
})
export class UsersModule {}
