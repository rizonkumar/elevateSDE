import { ResumeAnalysis } from '../entities/resume-analysis';

export abstract class IResumeRepository {
  abstract create(resume: ResumeAnalysis): Promise<void>;
  abstract save(resume: ResumeAnalysis): Promise<void>;
  abstract findById(id: string): Promise<ResumeAnalysis | null>;
  abstract findAllForUser(userId: string, limit: number): Promise<ResumeAnalysis[]>;
  abstract delete(id: string): Promise<void>;
}
