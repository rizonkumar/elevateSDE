import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../../auth/guards/optional-jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { ProblemSocialService } from '../../application/problem-social.service';
import { ListPublicCollectionsQueryDto } from '../dtos/list-public-collections-query.dto';
import { PublicCollectionListResponseDto } from '../dtos/public-collection-list-response.dto';
import { PublicCollectionDetailResponseDto } from '../dtos/public-collection-detail-response.dto';
import { ProblemSocialPresentationMapper } from '../mappers/problem-social-presentation.mapper';

interface RequestWithOptionalUser {
  user: User | null;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

@ApiTags('Public Lists')
@Controller({ path: 'public/lists', version: '1' })
export class PublicCollectionController {
  constructor(private readonly problemSocialService: ProblemSocialService) {}

  @Get()
  @ApiOperation({ summary: 'Browse public problem lists' })
  @ApiResponse({ status: 200, type: PublicCollectionListResponseDto })
  async list(
    @Query() query: ListPublicCollectionsQueryDto,
  ): Promise<PublicCollectionListResponseDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const result = await this.problemSocialService.listPublicCollections({
      search: query.search,
      page,
      pageSize,
    });
    return ProblemSocialPresentationMapper.toPublicCollectionListResponse(result, page, pageSize);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a public problem list, with viewer progress when authenticated' })
  @ApiResponse({ status: 200, type: PublicCollectionDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Not found or not public.' })
  async detail(
    @Param('id') id: string,
    @Req() req: RequestWithOptionalUser,
  ): Promise<PublicCollectionDetailResponseDto> {
    const viewerId = req.user?.getId() ?? null;
    const detail = await this.problemSocialService.getPublicCollection(id, viewerId);
    return ProblemSocialPresentationMapper.toPublicCollectionDetailResponse(detail);
  }
}
