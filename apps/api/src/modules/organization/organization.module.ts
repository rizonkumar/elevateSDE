import { Module } from '@nestjs/common';
import { IOrganizationRepository } from './domain/interfaces/organization-repository.interface';
import { OrganizationRepository } from './infrastructure/repositories/organization.repository';
import { OrganizationService } from './application/organization.service';
import { OrganizationController } from './presentation/controllers/organization.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    PrismaService,
    {
      provide: IOrganizationRepository,
      useClass: OrganizationRepository,
    },
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
