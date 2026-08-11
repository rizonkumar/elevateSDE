import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ACCEPTED_RESUME_MIME_TYPES, MAX_RESUME_SIZE_BYTES } from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { IResumeAnalysisQueue } from '../../../queues/domain/interfaces/resume-analysis-queue.interface';
import { IResumeTextExtractor } from '../../domain/interfaces/resume-text-extractor.interface';
import { isReadableResumeText } from '../../domain/scoring/resume-scoring';
import { ResumeService } from '../../application/resume.service';
import { ResumeResponseDto } from '../dtos/resume-response.dto';
import { ResumePresentationMapper } from '../mappers/resume-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Resume')
@ApiBearerAuth()
@Controller({ path: 'resume', version: '1' })
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly resumeTextExtractor: IResumeTextExtractor,
    private readonly resumeAnalysisQueue: IResumeAnalysisQueue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_RESUME_SIZE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resume for ATS analysis' })
  @ApiResponse({ status: 202, type: ResumeResponseDto })
  @ApiResponse({ status: 400, description: 'Unsupported file type or missing file' })
  @ApiResponse({ status: 422, description: 'Could not read enough text from the file' })
  async upload(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ResumeResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }
    if (!ACCEPTED_RESUME_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Please upload a PDF or DOCX resume.');
    }

    const text = await this.resumeTextExtractor.extract(file.buffer, file.mimetype);
    if (!isReadableResumeText(text)) {
      throw new UnprocessableEntityException('We could not read enough text from this file.');
    }

    const resume = await this.resumeService.createPending({
      userId: req.user.getId(),
      tenantId: req.user.getTenantId(),
      fileName: file.originalname,
    });
    await this.resumeAnalysisQueue.enqueue({
      resumeId: resume.getId(),
      userId: resume.getUserId(),
      text,
    });

    return ResumePresentationMapper.toResponse(resume);
  }

  @Get()
  @ApiOperation({ summary: 'List past resume analyses for the current user' })
  @ApiResponse({ status: 200, type: [ResumeResponseDto] })
  async list(@Req() req: RequestWithUser): Promise<ResumeResponseDto[]> {
    const resumes = await this.resumeService.listForUser(req.user.getId());
    return resumes.map((resume) => ResumePresentationMapper.toResponse(resume));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Poll a resume analysis by id' })
  @ApiResponse({ status: 200, type: ResumeResponseDto })
  @ApiResponse({ status: 404, description: 'Resume analysis not found' })
  async getOne(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResumeResponseDto> {
    const resume = await this.resumeService.getForUser(req.user.getId(), id);
    return ResumePresentationMapper.toResponse(resume);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a resume analysis' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Resume analysis not found' })
  async remove(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.resumeService.deleteForUser(req.user.getId(), id);
  }
}
