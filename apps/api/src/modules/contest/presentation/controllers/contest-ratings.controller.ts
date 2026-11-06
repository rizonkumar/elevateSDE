import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ContestRatingService } from '../../application/contest-rating.service';
import { RatingLeaderboardScope } from '../../domain/read-models/contest-rating-view';
import { ContestRatingLeaderboardQueryDto } from '../dtos/contest-rating-query.dto';
import {
  ContestRatingLeaderboardResponseDto,
  ContestRatingSummaryResponseDto,
} from '../dtos/contest-rating-response.dto';
import { ContestRatingPresentationMapper } from '../mappers/contest-rating-presentation.mapper';

const LEADERBOARD_PAGE_SIZE = 25;

interface RequestWithUser {
  user: User;
}

@ApiTags('Contest Ratings')
@ApiBearerAuth()
@Controller({ path: 'contests/ratings', version: '1' })
@UseGuards(JwtAuthGuard)
export class ContestRatingsController {
  constructor(private readonly ratingService: ContestRatingService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user contest rating and rating history' })
  @ApiResponse({ status: 200, type: ContestRatingSummaryResponseDto })
  async me(@Req() req: RequestWithUser): Promise<ContestRatingSummaryResponseDto> {
    const view = await this.ratingService.getSummary(req.user.getId());
    return ContestRatingPresentationMapper.toSummary(view);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'List rated users ordered by contest rating' })
  @ApiResponse({ status: 200, type: ContestRatingLeaderboardResponseDto })
  async leaderboard(
    @Query() query: ContestRatingLeaderboardQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<ContestRatingLeaderboardResponseDto> {
    const page = query.page ?? 1;
    const scope: RatingLeaderboardScope =
      query.scope === 'tenant'
        ? { kind: 'tenant', tenantId: req.user.getTenantId() }
        : { kind: 'platform' };
    const result = await this.ratingService.getLeaderboard(scope, page, LEADERBOARD_PAGE_SIZE);
    return ContestRatingPresentationMapper.toLeaderboard(
      result.rows,
      result.total,
      page,
      LEADERBOARD_PAGE_SIZE,
      req.user.getId(),
    );
  }
}
