import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';
import { RunAssessmentDto } from '../dtos/run-assessment.dto';
import { AssessmentRunResponseDto } from '../dtos/assessment-run-response.dto';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { AssessmentPresentationMapper } from '../mappers/assessment-presentation.mapper';
import { SubmissionPresentationMapper } from '../mappers/submission-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller({ path: 'assessments', version: '1' })
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(
    private readonly codeRunnerService: CodeRunnerService,
    private readonly submissionService: SubmissionService,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run candidate code against the visible test cases' })
  @ApiResponse({ status: 201, type: AssessmentRunResponseDto })
  async run(
    @Body() dto: RunAssessmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AssessmentRunResponseDto> {
    const outcome = await this.codeRunnerService.execute({
      userId: req.user.getId(),
      problemId: dto.problemId,
      language: dto.language,
      code: dto.code,
      persist: false,
    });
    return AssessmentPresentationMapper.toResponse(outcome, new Date().toISOString());
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit candidate code against all test cases and persist the result' })
  @ApiResponse({ status: 201, type: AssessmentRunResponseDto })
  async submit(
    @Body() dto: RunAssessmentDto,
    @Req() req: RequestWithUser,
  ): Promise<AssessmentRunResponseDto> {
    const outcome = await this.codeRunnerService.execute({
      userId: req.user.getId(),
      problemId: dto.problemId,
      language: dto.language,
      code: dto.code,
      persist: true,
    });
    return AssessmentPresentationMapper.toResponse(outcome, new Date().toISOString());
  }

  @Get('submissions')
  @ApiOperation({ summary: 'List the current user submissions for a problem' })
  @ApiResponse({ status: 200, type: [SubmissionResponseDto] })
  async submissions(
    @Query('problemId') problemId: string,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionResponseDto[]> {
    const submissions = await this.submissionService.listForUserProblem(
      req.user.getId(),
      problemId,
    );
    return submissions.map((submission) => SubmissionPresentationMapper.toResponse(submission));
  }
}
