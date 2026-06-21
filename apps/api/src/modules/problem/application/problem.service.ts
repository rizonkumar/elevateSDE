import { Injectable, NotFoundException } from '@nestjs/common';
import { Problem } from '../domain/entities/problem';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
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
}
