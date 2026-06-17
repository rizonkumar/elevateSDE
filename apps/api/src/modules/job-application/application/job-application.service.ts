import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobApplicationStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { IJobApplicationRepository } from '../domain/interfaces/job-application-repository.interface';
import { JobApplication } from '../domain/entities/job-application';

export interface CreateJobApplicationInput {
  company: string;
  role: string;
  status?: JobApplicationStatus;
  salaryRange?: string | null;
  jobDescriptionUrl?: string | null;
  interviewDate?: Date | null;
}

export interface UpdateJobApplicationInput {
  company?: string;
  role?: string;
  status?: JobApplicationStatus;
  salaryRange?: string | null;
  jobDescriptionUrl?: string | null;
  interviewDate?: Date | null;
  boardPosition?: number;
}

@Injectable()
export class JobApplicationService {
  constructor(private readonly jobApplicationRepository: IJobApplicationRepository) {}

  async listForUser(userId: string): Promise<JobApplication[]> {
    return this.jobApplicationRepository.findByUser(userId);
  }

  async create(userId: string, input: CreateJobApplicationInput): Promise<JobApplication> {
    const status = input.status ?? JobApplicationStatus.APPLIED;
    const boardPosition = await this.nextPosition(userId, status);
    const jobApplication = JobApplication.create(
      randomUUID(),
      userId,
      {
        company: input.company,
        role: input.role,
        status,
        salaryRange: input.salaryRange ?? null,
        jobDescriptionUrl: input.jobDescriptionUrl ?? null,
        interviewDate: input.interviewDate ?? null,
      },
      boardPosition,
    );
    return this.jobApplicationRepository.save(jobApplication);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateJobApplicationInput,
  ): Promise<JobApplication> {
    const existing = await this.findOwned(userId, id);
    const detailUpdates = {
      company: input.company,
      role: input.role,
      salaryRange: input.salaryRange,
      jobDescriptionUrl: input.jobDescriptionUrl,
      interviewDate: input.interviewDate,
    };
    let updated = existing.updateDetails(detailUpdates);
    if (input.status !== undefined || input.boardPosition !== undefined) {
      updated = updated.moveTo(
        input.status ?? updated.getStatus(),
        input.boardPosition ?? updated.getBoardPosition(),
      );
    }
    return this.jobApplicationRepository.save(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.jobApplicationRepository.delete(id);
  }

  private async findOwned(userId: string, id: string): Promise<JobApplication> {
    const jobApplication = await this.jobApplicationRepository.findById(id);
    if (!jobApplication) {
      throw new NotFoundException('Job application not found');
    }
    if (jobApplication.getUserId() !== userId) {
      throw new ForbiddenException('You do not have access to this job application');
    }
    return jobApplication;
  }

  private async nextPosition(userId: string, status: JobApplicationStatus): Promise<number> {
    const applications = await this.jobApplicationRepository.findByUser(userId);
    return applications.filter((application) => application.getStatus() === status).length;
  }
}
