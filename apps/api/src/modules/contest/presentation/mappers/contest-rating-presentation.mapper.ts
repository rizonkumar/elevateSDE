import { buildDisplayName } from '../../../../common/display-name';
import {
  RatingHistoryEntryView,
  RatingLeaderboardRowView,
  UserRatingSummaryView,
} from '../../domain/read-models/contest-rating-view';
import {
  ContestRatingHistoryEntryResponseDto,
  ContestRatingLeaderboardEntryResponseDto,
  ContestRatingLeaderboardResponseDto,
  ContestRatingSummaryResponseDto,
} from '../dtos/contest-rating-response.dto';

export class ContestRatingPresentationMapper {
  static toSummary(view: UserRatingSummaryView): ContestRatingSummaryResponseDto {
    const dto = new ContestRatingSummaryResponseDto();
    dto.rating = view.rating;
    dto.peakRating = view.peakRating;
    dto.contestsRated = view.contestsRated;
    dto.history = view.history.map((entry) => ContestRatingPresentationMapper.toHistoryEntry(entry));
    return dto;
  }

  static toHistoryEntry(view: RatingHistoryEntryView): ContestRatingHistoryEntryResponseDto {
    const dto = new ContestRatingHistoryEntryResponseDto();
    dto.contestId = view.contestId;
    dto.slug = view.slug;
    dto.title = view.title;
    dto.endsAt = view.endsAt.toISOString();
    dto.rank = view.rank;
    dto.oldRating = view.oldRating;
    dto.newRating = view.newRating;
    dto.delta = view.delta;
    return dto;
  }

  static toLeaderboard(
    rows: RatingLeaderboardRowView[],
    total: number,
    page: number,
    pageSize: number,
    viewerId: string,
  ): ContestRatingLeaderboardResponseDto {
    const dto = new ContestRatingLeaderboardResponseDto();
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    dto.items = rows.map((row, index) => {
      const entry = new ContestRatingLeaderboardEntryResponseDto();
      entry.rank = (page - 1) * pageSize + index + 1;
      entry.userId = row.userId;
      entry.name = buildDisplayName(row.firstName, row.lastName);
      entry.publicHandle = row.publicHandle;
      entry.rating = row.rating;
      entry.peakRating = row.peakRating;
      entry.contestsRated = row.contestsRated;
      entry.isCurrentUser = row.userId === viewerId;
      return entry;
    });
    return dto;
  }
}
