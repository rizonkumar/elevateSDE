import { JobApplication } from '../../domain/entities/job-application';
import { JobApplication as PrismaJobApplication } from '@prisma/client';

export class JobApplicationMapper {
  static toDomain(record: PrismaJobApplication): JobApplication {
    return JobApplication.reconstitute(
      record.id,
      record.userId,
      record.company,
      record.role,
      record.status,
      record.salaryRange,
      record.jobDescriptionUrl,
      record.interviewDate,
      record.boardPosition,
      record.createdAt,
      record.updatedAt,
    );
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
