import { RankedLeaderboardEntry } from '../../domain/read-models/leaderboard-entry-view';
import { LeaderboardEntryResponseDto } from '../dtos/leaderboard-entry-response.dto';

export class LeaderboardPresentationMapper {
  static toResponse(entry: RankedLeaderboardEntry): LeaderboardEntryResponseDto {
    const dto = new LeaderboardEntryResponseDto();
    dto.rank = entry.rank;
    dto.userId = entry.view.userId;
    dto.name = buildName(entry.view.firstName, entry.view.lastName);
    dto.headline = entry.view.headline;
    dto.points = entry.view.points;
    dto.assessmentsCompleted = entry.view.assessmentsCompleted;
    dto.badges = entry.view.badges;
    dto.streakDays = entry.view.streakDays;
    dto.isCurrentUser = entry.isCurrentUser;
    return dto;
  }
}

function buildName(firstName: string | null, lastName: string | null): string {
  const name = [firstName, lastName].filter((part) => part && part.trim().length > 0).join(' ');
  return name.length > 0 ? name : 'Member';
}
