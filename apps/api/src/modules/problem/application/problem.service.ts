import { Injectable, NotFoundException } from '@nestjs/common';
import { Problem } from '../domain/entities/problem';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
  ProblemWriteInput,
} from '../domain/interfaces/problem-repository.interface';

@Injectable()
export class ProblemService {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async list(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.problemRepository.findPublished(filter);
  }

  async getById(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findById(id);
    if (!problem?.isPublished()) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async listForAdmin(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.problemRepository.findAll(filter);
  }

  async getByIdForAdmin(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async create(input: ProblemWriteInput): Promise<Problem> {
    return this.problemRepository.create(input);
  }

  async update(id: string, input: Partial<ProblemWriteInput>): Promise<Problem> {
    const existing = await this.getByIdForAdmin(id);
    const merged: ProblemWriteInput = {
      title: input.title ?? existing.getTitle(),
      difficulty: input.difficulty ?? existing.getDifficulty(),
      description: input.description ?? existing.getDescription(),
      constraints: input.constraints ?? existing.getConstraints(),
      tags: input.tags ?? existing.getTags(),
      starterCode: input.starterCode ?? existing.getStarterCode(),
      timeLimitMinutes: input.timeLimitMinutes ?? existing.getTimeLimitMinutes(),
      isPublished: input.isPublished ?? existing.isPublished(),
      testCases:
        input.testCases ??
        existing.getTestCases().map((testCase) => ({
          input: testCase.getInput(),
          expectedOutput: testCase.getExpectedOutput(),
          isHidden: testCase.isHidden(),
        })),
    };
    return this.problemRepository.update(id, merged);
  }

  async setPublished(id: string, isPublished: boolean): Promise<Problem> {
    await this.getByIdForAdmin(id);
    return this.problemRepository.setPublished(id, isPublished);
  }

  async remove(id: string): Promise<void> {
    await this.getByIdForAdmin(id);
    await this.problemRepository.delete(id);
  }
}
