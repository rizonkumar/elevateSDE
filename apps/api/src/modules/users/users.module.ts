import { Module } from '@nestjs/common';
import { IUsersRepository } from './domain/interfaces/users-repository.interface';
import { UsersRepository } from './infrastructure/repositories/users.repository';
import { UsersService } from './application/users.service';
import { UsersController } from './presentation/controllers/users.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    {
      provide: IUsersRepository,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
