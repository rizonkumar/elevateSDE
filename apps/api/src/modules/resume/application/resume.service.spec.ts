import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ResumeAnalysis } from '../domain/entities/resume-analysis';
import { IResumeRepository } from '../domain/interfaces/resume-repository.interface';
import { ResumeScoreResult } from '../domain/interfaces/resume-analyzer.interface';
import { ResumeService } from './resume.service';

class FakeResumeRepository implements IResumeRepository {
  readonly resumes = new Map<string, ResumeAnalysis>();

  async create(resume: ResumeAnalysis): Promise<void> {
    this.resumes.set(resume.getId(), resume);
  }

  async save(resume: ResumeAnalysis): Promise<void> {
    this.resumes.set(resume.getId(), resume);
  }

  async findById(id: string): Promise<ResumeAnalysis | null> {
    return this.resumes.get(id) ?? null;
  }

  async findAllForUser(userId: string, limit: number): Promise<ResumeAnalysis[]> {
    return [...this.resumes.values()]
      .filter((resume) => resume.getUserId() === userId)
      .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime())
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.resumes.delete(id);
  }
}

const SAMPLE_RESULT: ResumeScoreResult = {
  atsScore: 82,
  parsedSkills: ['TypeScript'],
  missingSkills: ['Go'],
  structureFeedback: [],
  actionableTips: [],
  summary: 'Strong resume.',
};

describe('ResumeService', () => {
  let repository: FakeResumeRepository;
  let service: ResumeService;

  beforeEach(() => {
    repository = new FakeResumeRepository();
    service = new ResumeService(repository);
  });

  describe('createPending', () => {
    it('persists a PROCESSING resume for the uploading user', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      expect(resume.getStatus()).toBe('PROCESSING');
      expect(await repository.findById(resume.getId())).not.toBeNull();
    });
  });

  describe('applyResult', () => {
    it('transitions a resume to COMPLETED with the scored result', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      await service.applyResult(resume.getId(), SAMPLE_RESULT);

      const updated = await repository.findById(resume.getId());
      expect(updated?.getStatus()).toBe('COMPLETED');
      expect(updated?.getAtsScore()).toBe(82);
    });

    it('throws NotFoundException for an unknown resume id', async () => {
      await expect(service.applyResult('missing', SAMPLE_RESULT)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('markFailed', () => {
    it('transitions a resume to FAILED with the given reason', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      await service.markFailed(resume.getId(), 'extraction failed');

      const updated = await repository.findById(resume.getId());
      expect(updated?.getStatus()).toBe('FAILED');
      expect(updated?.getFailureReason()).toBe('extraction failed');
    });
  });

  describe('getForUser', () => {
    it('throws ForbiddenException when the resume belongs to another user', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      await expect(service.getForUser('user-2', resume.getId())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws NotFoundException for an unknown resume id', async () => {
      await expect(service.getForUser('user-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the resume when owned by the requesting user', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      const found = await service.getForUser('user-1', resume.getId());
      expect(found.getId()).toBe(resume.getId());
    });
  });

  describe('deleteForUser', () => {
    it('removes the resume when owned by the requesting user', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      await service.deleteForUser('user-1', resume.getId());

      expect(await repository.findById(resume.getId())).toBeNull();
    });

    it('throws ForbiddenException instead of deleting another user\'s resume', async () => {
      const resume = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'resume.pdf',
      });

      await expect(service.deleteForUser('user-2', resume.getId())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(await repository.findById(resume.getId())).not.toBeNull();
    });
  });

  describe('listForUser', () => {
    it('returns only resumes owned by the requesting user', async () => {
      const first = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'first.pdf',
      });
      await service.createPending({ userId: 'user-2', tenantId: null, fileName: 'other.pdf' });
      const second = await service.createPending({
        userId: 'user-1',
        tenantId: null,
        fileName: 'second.pdf',
      });

      const results = await service.listForUser('user-1');

      expect(results.map((resume) => resume.getId()).sort()).toEqual(
        [first.getId(), second.getId()].sort(),
      );
    });
  });
});
