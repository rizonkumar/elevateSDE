import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContestStatus } from '@prisma/client';
import {
  ContestStatusTransitionResult,
  IContestRepository,
} from '../domain/interfaces/contest-repository.interface';
import { Contest } from '../domain/entities/contest';
import { deriveContestStatus } from '../domain/contest-status';
import {
  ContestDetailView,
  ContestProblemAssignment,
  ContestSummaryView,
} from '../domain/read-models/contest-view';

const GLOBAL_SCOPE: string | null = null;

export interface SaveContestInput {
  slug: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class ContestService {
  constructor(private readonly repository: IContestRepository) {}

  async list(): Promise<ContestSummaryView[]> {
    const now = new Date();
    const views = await this.repository.list();
    return views.map((view) => this.withDerivedSummaryStatus(view, now));
  }

  async syncStatuses(now: Date): Promise<ContestStatusTransitionResult> {
    return this.repository.applyStatusTransitions(now);
  }

  async getDetail(id: string): Promise<ContestDetailView> {
    const view = await this.repository.findDetail(id);
    if (!view) {
      throw new NotFoundException('Contest not found');
    }
    return this.withDerivedDetailStatus(view, new Date());
  }

  async create(input: SaveContestInput): Promise<ContestDetailView> {
    this.assertWindow(input.startsAt, input.endsAt);
    const existing = await this.repository.findIdBySlug(input.slug);
    if (existing) {
      throw new ConflictException('A contest with that slug already exists');
    }
    const contest = Contest.create({
      slug: input.slug,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      tenantId: GLOBAL_SCOPE,
    });
    await this.repository.create(contest);
    return this.getDetail(contest.getId());
  }

  async update(id: string, input: SaveContestInput): Promise<ContestDetailView> {
    this.assertWindow(input.startsAt, input.endsAt);
    const contest = await this.requireContest(id);
    const slugOwner = await this.repository.findIdBySlug(input.slug);
    if (slugOwner && slugOwner !== id) {
      throw new ConflictException('A contest with that slug already exists');
    }
    await this.repository.update(
      contest.withDetails({
        slug: input.slug,
        title: input.title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      }),
    );
    return this.getDetail(id);
  }

  async setProblems(
    id: string,
    problems: { problemId: string; points: number }[],
  ): Promise<ContestDetailView> {
    await this.requireContest(id);
    const uniqueIds = [...new Set(problems.map((problem) => problem.problemId))];
    if (uniqueIds.length !== problems.length) {
      throw new BadRequestException('A problem can only be added to a contest once');
    }
    const published = await this.repository.findPublishedProblems(uniqueIds);
    if (published.length !== uniqueIds.length) {
      throw new BadRequestException('One or more problems were not found or are not published');
    }
    const assignments: ContestProblemAssignment[] = problems.map((problem, index) => ({
      problemId: problem.problemId,
      ordinal: index,
      points: problem.points,
    }));
    await this.repository.setProblems(id, assignments);
    return this.getDetail(id);
  }

  async setPublished(id: string, publish: boolean): Promise<ContestDetailView> {
    const contest = await this.requireContest(id);
    if (publish) {
      this.assertWindow(contest.getStartsAt(), contest.getEndsAt());
      const problemCount = await this.repository.countProblems(id);
      if (problemCount === 0) {
        throw new BadRequestException('Add at least one problem before publishing the contest');
      }
    }
    await this.repository.update(
      contest.withStatus(publish ? ContestStatus.SCHEDULED : ContestStatus.DRAFT),
    );
    return this.getDetail(id);
  }

  async remove(id: string): Promise<void> {
    await this.requireContest(id);
    await this.repository.remove(id);
  }

  private async requireContest(id: string): Promise<Contest> {
    const contest = await this.repository.findById(id);
    if (!contest) {
      throw new NotFoundException('Contest not found');
    }
    return contest;
  }

  private assertWindow(startsAt: Date, endsAt: Date): void {
    if (endsAt <= startsAt) {
      throw new BadRequestException('The contest end time must be after the start time');
    }
  }

  private withDerivedSummaryStatus(view: ContestSummaryView, now: Date): ContestSummaryView {
    return {
      ...view,
      status: deriveContestStatus(view.status, view.startsAt, view.endsAt, now),
    };
  }

  private withDerivedDetailStatus(view: ContestDetailView, now: Date): ContestDetailView {
    return {
      ...view,
      status: deriveContestStatus(view.status, view.startsAt, view.endsAt, now),
    };
  }
}
