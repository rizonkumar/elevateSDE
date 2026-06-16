import { JobApplication } from '../entities/job-application';

export abstract class IJobApplicationRepository {
  abstract findByUser(userId: string): Promise<JobApplication[]>;
  abstract findById(id: string): Promise<JobApplication | null>;
  abstract save(jobApplication: JobApplication): Promise<JobApplication>;
  abstract delete(id: string): Promise<void>;
}
