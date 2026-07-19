import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { LearningPathService } from '../../application/learning-path.service';
import { CreateLearningPathDto } from '../dtos/create-learning-path.dto';
import { UpdateLearningPathDto } from '../dtos/update-learning-path.dto';
import { PublishLearningPathDto } from '../dtos/publish-learning-path.dto';
import { ModuleInputDto } from '../dtos/module-input.dto';
import { AddItemDto } from '../dtos/add-item.dto';
import { ReorderDto } from '../dtos/reorder.dto';
import {
  AdminLearningPathDetailResponseDto,
  AdminLearningPathListResponseDto,
} from '../dtos/admin-learning-path-response.dto';
import { LearningPathPresentationMapper } from '../mappers/learning-path-presentation.mapper';

@ApiTags('Learning Path Management')
@ApiBearerAuth()
@Controller({ path: 'admin/learning-paths', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class LearningPathManagementController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  @ApiOperation({ summary: 'List learning paths with module and problem counts' })
  @ApiResponse({ status: 200, type: AdminLearningPathListResponseDto })
  async list(): Promise<AdminLearningPathListResponseDto> {
    const views = await this.learningPathService.list();
    const items = views.map((view) => LearningPathPresentationMapper.toAdminSummary(view));
    return { items, total: items.length };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a learning path with its modules and items' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async detail(@Param('id') id: string): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.getDetail(id),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft learning path' })
  @ApiResponse({ status: 201, type: AdminLearningPathDetailResponseDto })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  async create(@Body() dto: CreateLearningPathDto): Promise<AdminLearningPathDetailResponseDto> {
    const view = await this.learningPathService.create({
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      tags: dto.tags,
      coverImage: dto.coverImage ?? null,
    });
    return LearningPathPresentationMapper.toAdminDetail(view);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update learning path details' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  @ApiResponse({ status: 409, description: 'Slug already in use.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    const view = await this.learningPathService.update(id, {
      slug: dto.slug,
      title: dto.title,
      description: dto.description,
      level: dto.level,
      tags: dto.tags,
      coverImage: dto.coverImage ?? null,
    });
    return LearningPathPresentationMapper.toAdminDetail(view);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a learning path' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Path is not ready to publish.' })
  async setPublished(
    @Param('id') id: string,
    @Body() dto: PublishLearningPathDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    const view = await this.learningPathService.setPublished(id, dto.publish);
    return LearningPathPresentationMapper.toAdminDetail(view);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a learning path' })
  @ApiResponse({ status: 204, description: 'Deleted.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.learningPathService.remove(id);
  }

  @Post(':id/modules')
  @ApiOperation({ summary: 'Add a module to a learning path' })
  @ApiResponse({ status: 201, type: AdminLearningPathDetailResponseDto })
  async addModule(
    @Param('id') id: string,
    @Body() dto: ModuleInputDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.addModule(id, dto.title),
    );
  }

  @Patch('modules/:moduleId')
  @ApiOperation({ summary: 'Rename a module' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  async renameModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: ModuleInputDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.renameModule(moduleId, dto.title),
    );
  }

  @Delete('modules/:moduleId')
  @ApiOperation({ summary: 'Delete a module' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  async removeModule(
    @Param('moduleId') moduleId: string,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.removeModule(moduleId),
    );
  }

  @Patch('modules/:moduleId/reorder')
  @ApiOperation({ summary: 'Move a module up or down' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  async reorderModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: ReorderDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.reorderModule(moduleId, dto.direction),
    );
  }

  @Post('modules/:moduleId/items')
  @ApiOperation({ summary: 'Add a published problem to a module' })
  @ApiResponse({ status: 201, type: AdminLearningPathDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Problem is missing or not published.' })
  @ApiResponse({ status: 409, description: 'Problem is already in the module.' })
  async addItem(
    @Param('moduleId') moduleId: string,
    @Body() dto: AddItemDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.addItem(moduleId, dto.problemId),
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove a problem from a module' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  async removeItem(@Param('itemId') itemId: string): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.removeItem(itemId),
    );
  }

  @Patch('items/:itemId/reorder')
  @ApiOperation({ summary: 'Move a problem up or down within its module' })
  @ApiResponse({ status: 200, type: AdminLearningPathDetailResponseDto })
  async reorderItem(
    @Param('itemId') itemId: string,
    @Body() dto: ReorderDto,
  ): Promise<AdminLearningPathDetailResponseDto> {
    return LearningPathPresentationMapper.toAdminDetail(
      await this.learningPathService.reorderItem(itemId, dto.direction),
    );
  }
}
