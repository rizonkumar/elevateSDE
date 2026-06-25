import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemService } from '../../../problem/application/problem.service';
import { ICodeExecutionQueue } from '../../../queues/domain/interfaces/code-execution-queue.interface';
import { CodeRunnerService } from '../../application/code-runner.service';
import { SubmissionService } from '../../application/submission.service';
import { SubmissionStatusValue } from '@elevatesde/shared-types';
import { RunAssessmentDto } from '../dtos/run-assessment.dto';
import { AssessmentRunResponseDto } from '../dtos/assessment-run-response.dto';
import { SubmissionResponseDto } from '../dtos/submission-response.dto';
import { SubmissionAcceptedResponseDto } from '../dtos/submission-accepted-response.dto';
import { SubmissionDetailResponseDto } from '../dtos/submission-detail-response.dto';
import { AssessmentPresentationMapper } from '../mappers/assessment-presentation.mapper';
import { SubmissionPresentationMapper } from '../mappers/submission-presentation.mapper';
import { SubmissionDetailPresentationMapper } from '../mappers/submission-detail-presentation.mapper';

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
    private readonly problemService: ProblemService,
    private readonly codeExecutionQueue: ICodeExecutionQueue,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run candidate code against the visible test cases' })
  @ApiResponse({ status: 201, type: AssessmentRunResponseDto })
  async run(@Body() dto: RunAssessmentDto): Promise<AssessmentRunResponseDto> {
    const outcome = await this.codeRunnerService.evaluate(dto.problemId, dto.language, dto.code, false);
    return AssessmentPresentationMapper.toResponse(outcome, new Date().toISOString());
  }

  @Post('submit')
  @HttpCode(202)
  @ApiOperation({ summary: 'Queue candidate code for execution against all test cases' })
  @ApiResponse({ status: 202, type: SubmissionAcceptedResponseDto })
  async submit(
    @Body() dto: RunAssessmentDto,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionAcceptedResponseDto> {
    await this.problemService.getById(dto.problemId);
    const submission = await this.submissionService.createPending(
      req.user.getId(),
      dto.problemId,
      dto.language,
      dto.code,
    );
    await this.codeExecutionQueue.enqueue({
      submissionId: submission.getId(),
      userId: req.user.getId(),
      problemId: dto.problemId,
      language: dto.language,
      code: dto.code,
    });
    const response = new SubmissionAcceptedResponseDto();
    response.submissionId = submission.getId();
    response.status = submission.getStatus() as SubmissionStatusValue;
    return response;
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

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get a single submission with its execution results' })
  @ApiResponse({ status: 200, type: SubmissionDetailResponseDto })
  async submission(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<SubmissionDetailResponseDto> {
    const submission = await this.submissionService.getForUser(id, req.user.getId());
    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }
    const problem = await this.problemService.getById(submission.getProblemId());
    return SubmissionDetailPresentationMapper.toResponse(submission, problem);
  }
}
