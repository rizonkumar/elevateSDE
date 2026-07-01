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
import { ProblemSocialService } from '../../application/problem-social.service';
import { CreateProblemCollectionDto } from '../dtos/create-problem-collection.dto';
import { UpdateProblemCollectionDto } from '../dtos/update-problem-collection.dto';
import { AddCollectionItemDto } from '../dtos/add-collection-item.dto';
import { ReorderCollectionDto } from '../dtos/reorder-collection.dto';
import { BookmarkResponseDto } from '../dtos/bookmark-response.dto';
import { ProblemCollectionResponseDto } from '../dtos/problem-collection-response.dto';
import { ProblemSocialPresentationMapper } from '../mappers/problem-social-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Problem Curation')
@ApiBearerAuth()
@Controller({ path: 'me', version: '1' })
@UseGuards(JwtAuthGuard)
export class MeCurationController {
  constructor(private readonly problemSocialService: ProblemSocialService) {}

  @Get('bookmarks')
  @ApiOperation({ summary: 'List the current user bookmarked problems' })
  @ApiResponse({ status: 200, type: [BookmarkResponseDto] })
  async listBookmarks(@Req() req: RequestWithUser): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.problemSocialService.listBookmarks(req.user.getId());
    return bookmarks.map((bookmark) =>
      ProblemSocialPresentationMapper.toBookmarkResponse(bookmark),
    );
  }

  @Get('lists')
  @ApiOperation({ summary: 'List the current user problem collections' })
  @ApiResponse({ status: 200, type: [ProblemCollectionResponseDto] })
  async listCollections(@Req() req: RequestWithUser): Promise<ProblemCollectionResponseDto[]> {
    const collections = await this.problemSocialService.listCollections(req.user.getId());
    return collections.map((collection) =>
      ProblemSocialPresentationMapper.toCollectionResponse(collection),
    );
  }

  @Post('lists')
  @ApiOperation({ summary: 'Create a problem collection' })
  @ApiResponse({ status: 201, type: ProblemCollectionResponseDto })
  async createCollection(
    @Body() dto: CreateProblemCollectionDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.createCollection(req.user.getId(), {
      name: dto.name,
      isPublic: dto.isPublic,
    });
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }

  @Get('lists/:id')
  @ApiOperation({ summary: 'Get a problem collection' })
  @ApiResponse({ status: 200, type: ProblemCollectionResponseDto })
  async getCollection(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.getCollection(req.user.getId(), id);
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }

  @Patch('lists/:id')
  @ApiOperation({ summary: 'Rename a collection or change its visibility' })
  @ApiResponse({ status: 200, type: ProblemCollectionResponseDto })
  async updateCollection(
    @Param('id') id: string,
    @Body() dto: UpdateProblemCollectionDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.updateCollection(req.user.getId(), id, {
      name: dto.name,
      isPublic: dto.isPublic,
    });
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }

  @Delete('lists/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a collection' })
  @ApiResponse({ status: 204, description: 'Collection deleted.' })
  async deleteCollection(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    await this.problemSocialService.deleteCollection(req.user.getId(), id);
  }

  @Post('lists/:id/items')
  @ApiOperation({ summary: 'Add a problem to a collection' })
  @ApiResponse({ status: 201, type: ProblemCollectionResponseDto })
  async addItem(
    @Param('id') id: string,
    @Body() dto: AddCollectionItemDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.addCollectionItem(
      req.user.getId(),
      id,
      dto.problemId,
    );
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }

  @Delete('lists/:id/items/:problemId')
  @ApiOperation({ summary: 'Remove a problem from a collection' })
  @ApiResponse({ status: 200, type: ProblemCollectionResponseDto })
  async removeItem(
    @Param('id') id: string,
    @Param('problemId') problemId: string,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.removeCollectionItem(
      req.user.getId(),
      id,
      problemId,
    );
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }

  @Patch('lists/:id/reorder')
  @ApiOperation({ summary: 'Reorder the problems in a collection' })
  @ApiResponse({ status: 200, type: ProblemCollectionResponseDto })
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderCollectionDto,
    @Req() req: RequestWithUser,
  ): Promise<ProblemCollectionResponseDto> {
    const collection = await this.problemSocialService.reorderCollection(
      req.user.getId(),
      id,
      dto.orderedProblemIds,
    );
    return ProblemSocialPresentationMapper.toCollectionResponse(collection);
  }
}
