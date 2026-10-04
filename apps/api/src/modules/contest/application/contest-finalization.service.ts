import { Injectable, Logger } from '@nestjs/common';
import { PointsService } from '../../leaderboard/application/points.service';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { ContestDetailView, ContestFinalResult } from '../domain/read-models/contest-view';
import { finalizationCutoff } from '../domain/contest-status';
import { ContestStandingsService } from './contest-standings.service';

@Injectable()
export class ContestFinalizationService {
  private readonly logger = new Logger(ContestFinalizationService.name);

  constructor(
    private readonly repository: IContestRepository,
    private readonly standingsService: ContestStandingsService,
    private readonly pointsService: PointsService,
  ) {}

  async finalizeEnded(now: Date = new Date()): Promise<number> {
    const contestIds = await this.repository.findFinalizableContestIds(finalizationCutoff(now));
    let finalizedCount = 0;
    for (const contestId of contestIds) {
      if (await this.finalize(contestId, now)) {
        finalizedCount += 1;
      }
    }
    return finalizedCount;
  }

  private async finalize(contestId: string, finalizedAt: Date): Promise<boolean> {
    const detail = await this.repository.findDetail(contestId);
    if (!detail || (await this.hasPendingSubmissions(detail))) {
      return false;
    }
    const ranked = await this.standingsService.rank(detail);
    const results: ContestFinalResult[] = ranked.map(({ participant, rank, totals }) => ({
      userId: participant.userId,
      rank,
      score: totals.score,
      penaltySeconds: totals.penaltySeconds,
    }));
    const awarded = await this.pointsService.awardContestResults(contestId, results);
    const finalized = await this.repository.saveFinalResults(contestId, results, finalizedAt);
    if (finalized) {
      this.logger.log(
        `Finalized contest ${contestId}: ${results.length} participants, ${awarded} awarded`,
      );
    }
    return finalized;
  }

  private async hasPendingSubmissions(detail: ContestDetailView): Promise<boolean> {
    const pending = await this.repository.hasPendingSubmissionsInWindow(
      detail.problems.map((problem) => problem.problemId),
      detail.startsAt,
      detail.endsAt,
    );
    if (pending) {
      this.logger.log(`Deferring contest ${detail.id} finalization until judging completes`);
    }
    return pending;
  }
}
