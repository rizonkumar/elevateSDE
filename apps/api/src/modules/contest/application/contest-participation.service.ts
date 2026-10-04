import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContestStatus } from '@prisma/client';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { deriveContestStatus } from '../domain/contest-status';
import {
  ContestCandidateDetailView,
  ContestCandidateProblemView,
  ContestCandidateSummaryView,
  ContestDetailView,
  ContestStandingRowView,
} from '../domain/read-models/contest-view';
import { ContestStandingsService } from './contest-standings.service';

@Injectable()
export class ContestParticipationService {
  constructor(
    private readonly repository: IContestRepository,
    private readonly standingsService: ContestStandingsService,
  ) {}

  async listForUser(userId: string): Promise<ContestCandidateSummaryView[]> {
    const now = new Date();
    const views = await this.repository.listVisible();
    const [counts, registeredIds] = await Promise.all([
      this.repository.countParticipants(views.map((view) => view.id)),
      this.repository.findRegisteredContestIds(userId),
    ]);
    const registered = new Set(registeredIds);
    return views.map((view) => ({
      ...view,
      status: deriveContestStatus(view.status, view.startsAt, view.endsAt, now),
      participantCount: counts.get(view.id) ?? 0,
      registered: registered.has(view.id),
    }));
  }

  async getBySlugForUser(slug: string, userId: string): Promise<ContestCandidateDetailView> {
    const detail = await this.requireVisibleDetail(slug);
    const status = deriveContestStatus(detail.status, detail.startsAt, detail.endsAt, new Date());
    const [counts, registeredIds, problems] = await Promise.all([
      this.repository.countParticipants([detail.id]),
      this.repository.findRegisteredContestIds(userId),
      this.candidateProblems(detail, status, userId),
    ]);
    return {
      ...detail,
      status,
      participantCount: counts.get(detail.id) ?? 0,
      registered: registeredIds.includes(detail.id),
      problems,
    };
  }

  async register(slug: string, userId: string): Promise<void> {
    const detail = await this.requireVisibleDetail(slug);
    const status = deriveContestStatus(detail.status, detail.startsAt, detail.endsAt, new Date());
    if (status === ContestStatus.ENDED) {
      throw new BadRequestException('This contest has already ended');
    }
    await this.repository.addParticipant(detail.id, userId);
  }

  async standings(slug: string, userId: string): Promise<ContestStandingRowView[]> {
    const detail = await this.requireVisibleDetail(slug);
    const status = deriveContestStatus(detail.status, detail.startsAt, detail.endsAt, new Date());
    if (status === ContestStatus.SCHEDULED) {
      return [];
    }
    const ranked = await this.standingsService.rank(detail);
    return ranked.map(({ participant, rank, totals }) => ({
      rank,
      userId: participant.userId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      isCurrentUser: participant.userId === userId,
      ...totals,
    }));
  }

  private async candidateProblems(
    detail: ContestDetailView,
    status: ContestStatus,
    userId: string,
  ): Promise<ContestCandidateProblemView[]> {
    if (status === ContestStatus.SCHEDULED) {
      return [];
    }
    const accepted = await this.repository.findFirstAcceptedInWindow(
      detail.problems.map((problem) => problem.problemId),
      [userId],
      detail.startsAt,
      detail.endsAt,
    );
    const solved = new Set(accepted.map((submission) => submission.problemId));
    return detail.problems.map((problem) => ({
      ...problem,
      solved: solved.has(problem.problemId),
    }));
  }

  private async requireVisibleDetail(slug: string): Promise<ContestDetailView> {
    const id = await this.repository.findIdBySlug(slug);
    const detail = id ? await this.repository.findDetail(id) : null;
    if (!detail || detail.status === ContestStatus.DRAFT) {
      throw new NotFoundException('Contest not found');
    }
    return detail;
  }
}
