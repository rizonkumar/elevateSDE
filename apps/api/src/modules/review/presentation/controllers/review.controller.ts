import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ReviewService } from '../../application/review.service';
import { GradeReviewDto } from '../dtos/grade-review.dto';
import { ReviewItemResponseDto } from '../dtos/review-item-response.dto';
import { ReviewSummaryResponseDto } from '../dtos/review-summary-response.dto';
import { ReviewPresentationMapper } from '../mappers/review-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Review')
@ApiBearerAuth()
@Controller({ path: 'review', version: '1' })
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('due')
  @ApiOperation({ summary: 'List problems due for spaced-repetition review' })
  @ApiResponse({ status: 200, type: [ReviewItemResponseDto] })
  async getDue(@Req() req: RequestWithUser): Promise<ReviewItemResponseDto[]> {
    const views = await this.reviewService.dueToday(req.user.getId());
    return views.map((view) => ReviewPresentationMapper.toItem(view));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Review queue counts and 30-day due forecast' })
  @ApiResponse({ status: 200, type: ReviewSummaryResponseDto })
  async getSummary(@Req() req: RequestWithUser): Promise<ReviewSummaryResponseDto> {
    const view = await this.reviewService.summary(req.user.getId());
    return ReviewPresentationMapper.toSummary(view);
  }

  @Post(':problemId/grade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Grade a review and reschedule it on the forgetting curve' })
  @ApiResponse({ status: 200, type: ReviewItemResponseDto })
  @ApiResponse({ status: 404, description: 'Review item not found' })
  async grade(
    @Req() req: RequestWithUser,
    @Param('problemId', ParseUUIDPipe) problemId: string,
    @Body() dto: GradeReviewDto,
  ): Promise<ReviewItemResponseDto> {
    const view = await this.reviewService.grade(req.user.getId(), problemId, dto.quality);
    return ReviewPresentationMapper.toItem(view);
  }
}
