import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ResumeAnalysis } from '../domain/entities/resume-analysis';
import { IResumeRepository } from '../domain/interfaces/resume-repository.interface';
import { ResumeScoreResult } from '../domain/interfaces/resume-analyzer.interface';

const HISTORY_LIMIT = 20;

export interface CreatePendingResumeInput {
  userId: string;
  tenantId: string | null;
  fileName: string;
}

@Injectable()
export class ResumeService {
  constructor(private readonly resumeRepository: IResumeRepository) {}

  async createPending(input: CreatePendingResumeInput): Promise<ResumeAnalysis> {
    const resume = ResumeAnalysis.createPending({ ...input, now: new Date() });
    await this.resumeRepository.create(resume);
    return resume;
  }

  async applyResult(resumeId: string, result: ResumeScoreResult): Promise<void> {
    const resume = await this.findById(resumeId);
    await this.resumeRepository.save(resume.markCompleted(result, new Date()));
  }

  async markFailed(resumeId: string, reason: string): Promise<void> {
    const resume = await this.findById(resumeId);
    await this.resumeRepository.save(resume.markFailed(reason, new Date()));
  }

  async listForUser(userId: string): Promise<ResumeAnalysis[]> {
    return this.resumeRepository.findAllForUser(userId, HISTORY_LIMIT);
  }

  async getForUser(userId: string, id: string): Promise<ResumeAnalysis> {
    return this.findOwned(userId, id);
  }

  async deleteForUser(userId: string, id: string): Promise<void> {
    await this.findOwned(userId, id);
    await this.resumeRepository.delete(id);
  }

  private async findById(id: string): Promise<ResumeAnalysis> {
    const resume = await this.resumeRepository.findById(id);
    if (!resume) {
      throw new NotFoundException('Resume analysis not found');
    }
    return resume;
  }

  private async findOwned(userId: string, id: string): Promise<ResumeAnalysis> {
    const resume = await this.findById(id);
    if (resume.getUserId() !== userId) {
      throw new ForbiddenException('You do not have access to this resume analysis');
    }
    return resume;
  }
}
