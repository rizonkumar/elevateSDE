import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { ProblemAssistanceService } from '../../application/problem-assistance.service';
import { AdminProblemGuidanceResponseDto } from '../dtos/admin-problem-guidance-response.dto';
import { SaveProblemEditorialDto } from '../dtos/save-problem-editorial.dto';
import { SaveProblemHintsDto } from '../dtos/save-problem-hints.dto';
import { ProblemAssistancePresentationMapper } from '../mappers/problem-assistance-presentation.mapper';

@ApiTags('Coding Problems (Admin)')
@ApiBearerAuth()
@Controller({ path: 'admin/coding-problems', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProblemGuidanceAdminController {
  constructor(private readonly assistanceService: ProblemAssistanceService) {}

  @Get(':id/guidance')
  @ApiOperation({ summary: 'Get the editorial and hints for a coding problem' })
  @ApiResponse({ status: 200, type: AdminProblemGuidanceResponseDto })
  async getGuidance(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminProblemGuidanceResponseDto> {
    const view = await this.assistanceService.getGuidanceForAdmin(id);
    return ProblemAssistancePresentationMapper.toAdminGuidanceResponse(view);
  }

  @Put(':id/editorial')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create or update the editorial for a coding problem' })
  @ApiResponse({ status: 200, type: AdminProblemGuidanceResponseDto })
  async saveEditorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveProblemEditorialDto,
  ): Promise<AdminProblemGuidanceResponseDto> {
    const view = await this.assistanceService.saveEditorial(id, dto);
    return ProblemAssistancePresentationMapper.toAdminGuidanceResponse(view);
  }

  @Put(':id/hints')
  @HttpCode(200)
  @ApiOperation({ summary: 'Replace the ordered hints for a coding problem' })
  @ApiResponse({ status: 200, type: AdminProblemGuidanceResponseDto })
  async saveHints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveProblemHintsDto,
  ): Promise<AdminProblemGuidanceResponseDto> {
    const view = await this.assistanceService.saveHints(id, dto.hints);
    return ProblemAssistancePresentationMapper.toAdminGuidanceResponse(view);
  }
}
