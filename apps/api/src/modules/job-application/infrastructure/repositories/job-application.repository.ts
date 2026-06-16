import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '../../domain/interfaces/job-application-repository.interface';
import { JobApplication } from '../../domain/entities/job-application';
import { JobApplicationMapper } from '../mappers/job-application.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class JobApplicationRepository implements IJobApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<JobApplication[]> {
    const records = await this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { boardPosition: 'asc' }],
    });
    return records.map((record) => JobApplicationMapper.toDomain(record));
  }

  async findById(id: string): Promise<JobApplication | null> {
    const record = await this.prisma.jobApplication.findUnique({
      where: { id },
    });
    if (!record) {
      return null;
    }
    return JobApplicationMapper.toDomain(record);
  }

  async save(jobApplication: JobApplication): Promise<JobApplication> {
    const data = JobApplicationMapper.toPersistence(jobApplication);
    const record = await this.prisma.jobApplication.upsert({
      where: { id: data.id },
      update: {
        company: data.company,
        role: data.role,
        status: data.status,
        salaryRange: data.salaryRange,
        jobDescriptionUrl: data.jobDescriptionUrl,
        interviewDate: data.interviewDate,
        boardPosition: data.boardPosition,
      },
      create: {
        id: data.id,
        userId: data.userId,
        company: data.company,
        role: data.role,
        status: data.status,
        salaryRange: data.salaryRange,
        jobDescriptionUrl: data.jobDescriptionUrl,
        interviewDate: data.interviewDate,
        boardPosition: data.boardPosition,
      },
    });
    return JobApplicationMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.jobApplication.delete({
      where: { id },
    });
  }
}
