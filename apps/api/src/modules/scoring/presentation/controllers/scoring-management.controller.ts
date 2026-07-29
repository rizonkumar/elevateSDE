import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ScoringService } from '../../application/scoring.service';
import { BackfillScoringDto } from '../dtos/backfill-scoring.dto';
import { ScoringBackfillResponseDto } from '../dtos/scoring-backfill-response.dto';
import { ScoringPresentationMapper } from '../mappers/scoring-presentation.mapper';

@ApiTags('Scoring Management')
@ApiBearerAuth()
@Controller({ path: 'admin/scoring', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ScoringManagementController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('backfill')
  @ApiOperation({ summary: 'Recompute the points ledger from accepted submission history' })
  @ApiResponse({ status: 201, type: ScoringBackfillResponseDto })
  async backfill(@Body() dto: BackfillScoringDto): Promise<ScoringBackfillResponseDto> {
    const result = await this.scoringService.backfill({
      dryRun: dto.dryRun ?? false,
      evaluateBadges: dto.evaluateBadges ?? false,
    });
    return ScoringPresentationMapper.toBackfillResponse(result);
  }
}
