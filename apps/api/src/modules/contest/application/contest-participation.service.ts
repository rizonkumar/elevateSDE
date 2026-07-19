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

interface ParticipantTotals {
  solvedCount: number;
  score: number;
  penaltySeconds: number;
}

const EMPTY_TOTALS: ParticipantTotals = { solvedCount: 0, score: 0, penaltySeconds: 0 };

@Injectable()
export class ContestParticipationService {
  constructor(private readonly repository: IContestRepository) {}

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
    const participants = await this.repository.listParticipants(detail.id);
    const accepted = await this.repository.findFirstAcceptedInWindow(
      detail.problems.map((problem) => problem.problemId),
      participants.map((participant) => participant.userId),
      detail.startsAt,
      detail.endsAt,
    );
    const totals = this.aggregateTotals(detail, accepted);
    const ranked = [...participants].sort((left, right) => {
      const leftTotals = totals.get(left.userId) ?? EMPTY_TOTALS;
      const rightTotals = totals.get(right.userId) ?? EMPTY_TOTALS;
      if (rightTotals.score !== leftTotals.score) {
        return rightTotals.score - leftTotals.score;
      }
      if (leftTotals.penaltySeconds !== rightTotals.penaltySeconds) {
        return leftTotals.penaltySeconds - rightTotals.penaltySeconds;
      }
      return left.userId.localeCompare(right.userId);
    });
    return ranked.map((participant, index) => ({
      rank: index + 1,
      userId: participant.userId,
      firstName: participant.firstName,
      lastName: participant.lastName,
      isCurrentUser: participant.userId === userId,
      ...(totals.get(participant.userId) ?? EMPTY_TOTALS),
    }));
  }

  private aggregateTotals(
    detail: ContestDetailView,
    accepted: { userId: string; problemId: string; firstAcceptedAt: Date }[],
  ): Map<string, ParticipantTotals> {
    const pointsByProblem = new Map(
      detail.problems.map((problem) => [problem.problemId, problem.points]),
    );
    const totals = new Map<string, ParticipantTotals>();
    for (const submission of accepted) {
      const current = totals.get(submission.userId) ?? { ...EMPTY_TOTALS };
      current.solvedCount += 1;
      current.score += pointsByProblem.get(submission.problemId) ?? 0;
      current.penaltySeconds += Math.max(
        0,
        Math.floor((submission.firstAcceptedAt.getTime() - detail.startsAt.getTime()) / 1000),
      );
      totals.set(submission.userId, current);
    }
    return totals;
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
