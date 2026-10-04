import { Injectable } from '@nestjs/common';
import { IContestRepository } from '../domain/interfaces/contest-repository.interface';
import { RankedParticipant, rankContestParticipants } from '../domain/contest-standings';
import { ContestDetailView, ContestParticipantView } from '../domain/read-models/contest-view';

@Injectable()
export class ContestStandingsService {
  constructor(private readonly repository: IContestRepository) {}

  async rank(detail: ContestDetailView): Promise<RankedParticipant<ContestParticipantView>[]> {
    const participants = await this.repository.listParticipants(detail.id);
    const accepted = await this.repository.findFirstAcceptedInWindow(
      detail.problems.map((problem) => problem.problemId),
      participants.map((participant) => participant.userId),
      detail.startsAt,
      detail.endsAt,
    );
    return rankContestParticipants({
      problems: detail.problems,
      startsAt: detail.startsAt,
      participants,
      accepted,
    });
  }
}
