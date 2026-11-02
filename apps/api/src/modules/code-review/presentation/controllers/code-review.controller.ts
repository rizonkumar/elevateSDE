import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { CodeReviewService } from '../../application/code-review.service';
import {
  CodeReviewQuotaResponseDto,
  SubmissionReviewResponseDto,
} from '../dtos/submission-review-response.dto';
import { CodeReviewPresentationMapper } from '../mappers/code-review-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Code Review')
@ApiBearerAuth()
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class CodeReviewController {
  constructor(private readonly codeReviewService: CodeReviewService) {}

  @Get('code-reviews/quota')
  @ApiOperation({ summary: 'How many code reviews the current user has left today' })
  @ApiResponse({ status: 200, type: CodeReviewQuotaResponseDto })
  async quota(@Req() req: RequestWithUser): Promise<CodeReviewQuotaResponseDto> {
    const quota = await this.codeReviewService.getQuota(req.user.getId());
    return CodeReviewPresentationMapper.toQuotaResponse(quota);
  }

  @Post('submissions/:id/review')
  @HttpCode(202)
  @ApiOperation({ summary: 'Request a code review of one of your submissions' })
  @ApiResponse({ status: 202, type: SubmissionReviewResponseDto })
  @ApiResponse({ status: 403, description: 'Feature disabled or live contest.' })
  @ApiResponse({ status: 409, description: 'Submission cannot be reviewed.' })
  @ApiResponse({ status: 429, description: 'Daily review limit reached.' })
  async request(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionReviewResponseDto> {
    const review = await this.codeReviewService.request(req.user.getId(), id);
    return CodeReviewPresentationMapper.toResponse(review);
  }

  @Get('submissions/:id/review')
  @ApiOperation({ summary: 'Get the code review of one of your submissions' })
  @ApiResponse({ status: 200, type: SubmissionReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Not reviewed yet.' })
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionReviewResponseDto> {
    const review = await this.codeReviewService.getForSubmission(req.user.getId(), id);
    return CodeReviewPresentationMapper.toResponse(review);
  }
}
