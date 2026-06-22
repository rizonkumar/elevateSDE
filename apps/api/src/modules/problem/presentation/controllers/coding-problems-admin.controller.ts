import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ProblemService } from '../../application/problem.service';
import { ListProblemsQueryDto } from '../dtos/list-problems-query.dto';
import { CreateCodingProblemDto } from '../dtos/create-coding-problem.dto';
import { UpdateCodingProblemDto } from '../dtos/update-coding-problem.dto';
import { SetProblemPublishDto } from '../dtos/set-problem-publish.dto';
import { AdminCodingProblemResponseDto } from '../dtos/admin-coding-problem-response.dto';
import { AdminProblemListResponseDto } from '../dtos/admin-problem-list-response.dto';
import { ProblemPresentationMapper } from '../mappers/problem-presentation.mapper';

@ApiTags('Coding Problems (Admin)')
@ApiBearerAuth()
@Controller({ path: 'admin/coding-problems', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
export class CodingProblemsAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @ApiOperation({ summary: 'List all coding problems including drafts' })
  @ApiResponse({ status: 200, type: AdminProblemListResponseDto })
  async list(@Query() query: ListProblemsQueryDto): Promise<AdminProblemListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 100;
    const result = await this.problemService.listForAdmin({
      difficulty: query.difficulty,
      tag: query.tag,
      search: query.search,
      page,
      pageSize,
    });
    const response = new AdminProblemListResponseDto();
    response.items = result.items.map((problem) =>
      ProblemPresentationMapper.toAdminSummary(problem),
    );
    response.total = result.total;
    return response;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coding problem with all test cases' })
  @ApiResponse({ status: 200, type: AdminCodingProblemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getById(@Param('id') id: string): Promise<AdminCodingProblemResponseDto> {
    const problem = await this.problemService.getByIdForAdmin(id);
    return ProblemPresentationMapper.toAdminCodingProblem(problem);
  }

  @Post()
  @ApiOperation({ summary: 'Create a coding problem' })
  @ApiResponse({ status: 201, type: AdminCodingProblemResponseDto })
  async create(@Body() dto: CreateCodingProblemDto): Promise<AdminCodingProblemResponseDto> {
    const problem = await this.problemService.create(dto);
    return ProblemPresentationMapper.toAdminCodingProblem(problem);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coding problem' })
  @ApiResponse({ status: 200, type: AdminCodingProblemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCodingProblemDto,
  ): Promise<AdminCodingProblemResponseDto> {
    const problem = await this.problemService.update(id, dto);
    return ProblemPresentationMapper.toAdminCodingProblem(problem);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a coding problem' })
  @ApiResponse({ status: 200, type: AdminCodingProblemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async setPublish(
    @Param('id') id: string,
    @Body() dto: SetProblemPublishDto,
  ): Promise<AdminCodingProblemResponseDto> {
    const problem = await this.problemService.setPublished(id, dto.isPublished);
    return ProblemPresentationMapper.toAdminCodingProblem(problem);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a coding problem' })
  @ApiResponse({ status: 204, description: 'Deleted.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.problemService.remove(id);
  }
}
