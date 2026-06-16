import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { JobApplicationService } from '../../application/job-application.service';
import { CreateJobApplicationDto } from '../dtos/create-job-application.dto';
import { UpdateJobApplicationDto } from '../dtos/update-job-application.dto';
import { JobApplicationResponseDto } from '../dtos/job-application-response.dto';
import { JobApplicationPresentationMapper } from '../mappers/job-application-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Job Applications')
@ApiBearerAuth()
@Controller({ path: 'job-applications', version: '1' })
@UseGuards(JwtAuthGuard)
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user job applications' })
  @ApiResponse({ status: 200, type: [JobApplicationResponseDto] })
  async list(@Req() req: RequestWithUser): Promise<JobApplicationResponseDto[]> {
    const applications = await this.jobApplicationService.listForUser(req.user.getId());
    return applications.map((application) =>
      JobApplicationPresentationMapper.toResponse(application),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a job application' })
  @ApiResponse({ status: 201, type: JobApplicationResponseDto })
  async create(
    @Body() dto: CreateJobApplicationDto,
    @Req() req: RequestWithUser,
  ): Promise<JobApplicationResponseDto> {
    const application = await this.jobApplicationService.create(req.user.getId(), {
      company: dto.company,
      role: dto.role,
      status: dto.status,
      salaryRange: dto.salaryRange ?? null,
      jobDescriptionUrl: dto.jobDescriptionUrl ?? null,
      interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : null,
    });
    return JobApplicationPresentationMapper.toResponse(application);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job application or move it across the board' })
  @ApiResponse({ status: 200, type: JobApplicationResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobApplicationDto,
    @Req() req: RequestWithUser,
  ): Promise<JobApplicationResponseDto> {
    const application = await this.jobApplicationService.update(req.user.getId(), id, {
      company: dto.company,
      role: dto.role,
      status: dto.status,
      salaryRange: dto.salaryRange,
      jobDescriptionUrl: dto.jobDescriptionUrl,
      interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
      boardPosition: dto.boardPosition,
    });
    return JobApplicationPresentationMapper.toResponse(application);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a job application' })
  @ApiResponse({ status: 204, description: 'Job application deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    await this.jobApplicationService.remove(req.user.getId(), id);
  }
}
