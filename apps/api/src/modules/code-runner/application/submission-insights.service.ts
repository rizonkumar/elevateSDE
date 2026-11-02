import { Injectable } from '@nestjs/common';
import { ProblemLanguage } from '../../problem/domain/entities/problem';
import { ISubmissionRepository } from '../domain/interfaces/submission-repository.interface';
import { IDistributionCache } from '../domain/interfaces/distribution-cache.interface';
import {
  PerformanceDistribution,
  PerformancePercentiles,
  buildDistribution,
  computePercentiles,
} from '../domain/insights/performance-insights';
import { toPrismaLanguage } from './language';

export interface AcceptedRun {
  userId: string;
  problemId: string;
  language: ProblemLanguage;
  runtimeMs: number;
  memoryKb: number;
}

@Injectable()
export class SubmissionInsightsService {
  constructor(
    private readonly submissionRepository: ISubmissionRepository,
    private readonly distributionCache: IDistributionCache,
  ) {}

  async percentilesFor(run: AcceptedRun): Promise<PerformancePercentiles> {
    const others = await this.submissionRepository.findBestAcceptedRuns(
      run.problemId,
      toPrismaLanguage[run.language],
      run.userId,
    );
    return computePercentiles({ runtimeMs: run.runtimeMs, memoryKb: run.memoryKb }, others);
  }

  async getDistribution(
    problemId: string,
    language: ProblemLanguage,
  ): Promise<PerformanceDistribution> {
    const key = `${problemId}:${language}`;
    const cached = this.distributionCache.get(key);
    if (cached) {
      return cached;
    }
    const runs = await this.submissionRepository.findBestAcceptedRuns(
      problemId,
      toPrismaLanguage[language],
      null,
    );
    const distribution = buildDistribution(runs);
    this.distributionCache.set(key, distribution);
    return distribution;
  }
}
