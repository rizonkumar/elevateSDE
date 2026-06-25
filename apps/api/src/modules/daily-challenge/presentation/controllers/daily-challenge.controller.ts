import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { DailyChallengeService } from '../../application/daily-challenge.service';
import { DailyChallengeResponseDto } from '../dtos/daily-challenge-response.dto';
import { StreakSummaryResponseDto } from '../dtos/streak-summary-response.dto';
import { DailyChallengePresentationMapper } from '../mappers/daily-challenge-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Daily Challenge')
@ApiBearerAuth()
@Controller({ path: 'daily-challenge', version: '1' })
@UseGuards(JwtAuthGuard)
export class DailyChallengeController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  @Get('today')
  @ApiOperation({ summary: "Get today's daily challenge for the current user" })
  @ApiResponse({ status: 200, type: DailyChallengeResponseDto })
  async getToday(@Req() req: RequestWithUser): Promise<DailyChallengeResponseDto | null> {
    const view = await this.dailyChallengeService.getToday(req.user.getId());
    return view ? DailyChallengePresentationMapper.toDaily(view) : null;
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get the current user streak summary and completion calendar' })
  @ApiResponse({ status: 200, type: StreakSummaryResponseDto })
  async getStreak(@Req() req: RequestWithUser): Promise<StreakSummaryResponseDto> {
    const summary = await this.dailyChallengeService.getStreakSummary(req.user.getId());
    return DailyChallengePresentationMapper.toStreak(summary);
  }
}
