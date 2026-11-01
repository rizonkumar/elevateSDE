import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ITaxonomyRepository } from './domain/interfaces/taxonomy-repository.interface';
import { TaxonomyRepository } from './infrastructure/repositories/taxonomy.repository';
import { TaxonomyService } from './application/taxonomy.service';
import { TaxonomyController } from './presentation/controllers/taxonomy.controller';
import { TopicsAdminController } from './presentation/controllers/topics-admin.controller';
import { CompaniesAdminController } from './presentation/controllers/companies-admin.controller';

@Module({
  controllers: [TaxonomyController, TopicsAdminController, CompaniesAdminController],
  providers: [
    TaxonomyService,
    PrismaService,
    {
      provide: ITaxonomyRepository,
      useClass: TaxonomyRepository,
    },
  ],
})
export class TaxonomyModule {}
