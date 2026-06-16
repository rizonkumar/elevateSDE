import { Module } from '@nestjs/common';
import { IJobApplicationRepository } from './domain/interfaces/job-application-repository.interface';
import { JobApplicationRepository } from './infrastructure/repositories/job-application.repository';
import { JobApplicationService } from './application/job-application.service';
import { JobApplicationController } from './presentation/controllers/job-application.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Module({
  controllers: [JobApplicationController],
  providers: [
    JobApplicationService,
    PrismaService,
    {
      provide: IJobApplicationRepository,
      useClass: JobApplicationRepository,
    },
  ],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
