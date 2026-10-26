import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { MockInterviewHistoryDto, MockInterviewSessionDto } from '@elevatesde/shared-types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { MockInterviewService } from '../../application/mock-interview.service';
import {
  MockInterviewHistoryQueryDto,
  StartMockInterviewRequestDto,
  SubmitMockInterviewAnswerRequestDto,
} from '../dtos/mock-interview.dto';
import { MockInterviewPresentationMapper } from '../mappers/mock-interview-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Mock Interviews')
@ApiBearerAuth()
@Controller({ path: 'mock-interviews', version: '1' })
@UseGuards(JwtAuthGuard)
export class MockInterviewController {
  constructor(private readonly service: MockInterviewService) {}

  @Post()
  @ApiOperation({ summary: 'Start a mock interview and receive the opening question' })
  @ApiResponse({ status: 409, description: 'Another mock interview is already in progress' })
  @ApiResponse({ status: 429, description: 'Daily mock interview limit reached' })
  async start(
    @Req() req: RequestWithUser,
    @Body() dto: StartMockInterviewRequestDto,
  ): Promise<MockInterviewSessionDto> {
    const session = await this.service.start({
      userId: req.user.getId(),
      tenantId: req.user.getTenantId(),
      config: {
        topic: dto.topic,
        roleLevel: dto.roleLevel,
        companyStyle: dto.companyStyle,
        durationMinutes: dto.durationMinutes,
      },
      preparationTaskId: dto.preparationTaskId ?? null,
    });
    return MockInterviewPresentationMapper.toDto(session);
  }

  @Get()
  @ApiOperation({ summary: 'List past mock interviews for the current user' })
  list(
    @Req() req: RequestWithUser,
    @Query() query: MockInterviewHistoryQueryDto,
  ): Promise<MockInterviewHistoryDto> {
    return this.service.list(req.user.getId(), query.cursor ?? null);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the mock interview currently in progress, if any' })
  async getActive(@Req() req: RequestWithUser): Promise<MockInterviewSessionDto | null> {
    const session = await this.service.getActive(req.user.getId());
    return session ? MockInterviewPresentationMapper.toDto(session) : null;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mock interview with its turns and report' })
  @ApiResponse({ status: 404, description: 'Mock interview not found' })
  async getOne(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MockInterviewSessionDto> {
    const session = await this.service.get(req.user.getId(), id);
    return MockInterviewPresentationMapper.toDto(session);
  }

  @Post(':id/turns/:turnId/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Answer the current question and receive the next one' })
  @ApiResponse({ status: 409, description: 'The session changed since it was loaded' })
  async answer(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('turnId', ParseUUIDPipe) turnId: string,
    @Body() dto: SubmitMockInterviewAnswerRequestDto,
  ): Promise<MockInterviewSessionDto> {
    const session = await this.service.answer({
      userId: req.user.getId(),
      sessionId: id,
      turnId,
      answer: dto.answer,
      version: dto.version,
    });
    return MockInterviewPresentationMapper.toDto(session);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a mock interview early and start scoring' })
  async end(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MockInterviewSessionDto> {
    const session = await this.service.end(req.user.getId(), id);
    return MockInterviewPresentationMapper.toDto(session);
  }
}
