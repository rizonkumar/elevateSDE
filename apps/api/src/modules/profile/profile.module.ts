import { Module } from '@nestjs/common';
import { IProfileRepository } from './domain/interfaces/profile-repository.interface';
import { ProfileRepository } from './infrastructure/repositories/profile.repository';
import { ProfileService } from './application/profile.service';
import { PublicProfileController } from './presentation/controllers/public-profile.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [PublicProfileController],
  providers: [
    ProfileService,
    PrismaService,
    {
      provide: IProfileRepository,
      useClass: ProfileRepository,
    },
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
