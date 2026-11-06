import { JobApplication } from '../../domain/entities/job-application';
import { JobApplication as PrismaJobApplication } from '@prisma/client';

export class JobApplicationMapper {
  static toDomain(record: PrismaJobApplication): JobApplication {
    return JobApplication.reconstitute({
      id: record.id,
      userId: record.userId,
      company: record.company,
      role: record.role,
      status: record.status,
      salaryRange: record.salaryRange,
      jobDescriptionUrl: record.jobDescriptionUrl,
      interviewDate: record.interviewDate,
      boardPosition: record.boardPosition,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(
    jobApplication: JobApplication,
  ): Omit<PrismaJobApplication, 'createdAt' | 'updatedAt'> {
    return {
      id: jobApplication.getId(),
      userId: jobApplication.getUserId(),
      company: jobApplication.getCompany(),
      role: jobApplication.getRole(),
      status: jobApplication.getStatus(),
      salaryRange: jobApplication.getSalaryRange(),
      jobDescriptionUrl: jobApplication.getJobDescriptionUrl(),
      interviewDate: jobApplication.getInterviewDate(),
      boardPosition: jobApplication.getBoardPosition(),
    };
  }
}
