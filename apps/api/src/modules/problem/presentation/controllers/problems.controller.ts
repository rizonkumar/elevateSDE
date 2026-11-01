import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemService } from '../../application/problem.service';
import { ListProblemsQueryDto } from '../dtos/list-problems-query.dto';
import { ProblemListResponseDto } from '../dtos/problem-list-response.dto';
import { CodingProblemResponseDto } from '../dtos/coding-problem-response.dto';
import { ProblemPresentationMapper } from '../mappers/problem-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Problems')
@ApiBearerAuth()
@Controller({ path: 'problems', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProblemsController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  @ApiOperation({ summary: 'List published coding problems' })
  @ApiResponse({ status: 200, type: ProblemListResponseDto })
  async list(
    @Query() query: ListProblemsQueryDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await this.problemService.list({
      difficulty: query.difficulty,
      topics: query.topics,
      company: query.company,
      status: query.status,
      viewerId: req.user.getId(),
      search: query.search,
      hasTestCases: query.hasTestCases,
      page,
      pageSize,
    });
    const response = new ProblemListResponseDto();
    response.items = result.items.map(({ problem, status }) =>
      ProblemPresentationMapper.toListItem(problem, status),
    );
    response.total = result.total;
    response.page = page;
    response.pageSize = pageSize;
    return response;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coding problem by id' })
  @ApiResponse({ status: 200, type: CodingProblemResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getById(@Param('id') id: string): Promise<CodingProblemResponseDto> {
    const problem = await this.problemService.getById(id);
    return ProblemPresentationMapper.toCodingProblem(problem);
  }
}
