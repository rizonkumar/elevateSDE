import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/domain/entities/user';
import { TaxonomyService } from '../../application/taxonomy.service';
import { CompanyResponseDto, TaxonomyTermResponseDto } from '../dtos/taxonomy-response.dto';
import { TaxonomyPresentationMapper } from '../mappers/taxonomy-presentation.mapper';

interface RequestWithUser {
  user: User;
}

@ApiTags('Taxonomy')
@ApiBearerAuth()
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get('topics')
  @ApiOperation({ summary: 'List topics that have published problems' })
  @ApiResponse({ status: 200, type: [TaxonomyTermResponseDto] })
  async listTopics(): Promise<TaxonomyTermResponseDto[]> {
    const topics = await this.taxonomyService.listTopics();
    return topics.map((topic) => TaxonomyPresentationMapper.toTermResponse(topic));
  }

  @Get('companies')
  @ApiOperation({ summary: 'List companies with the current user progress on their problems' })
  @ApiResponse({ status: 200, type: [CompanyResponseDto] })
  async listCompanies(@Req() req: RequestWithUser): Promise<CompanyResponseDto[]> {
    const companies = await this.taxonomyService.listCompanies(req.user.getId());
    return companies.map((company) => TaxonomyPresentationMapper.toCompanyResponse(company));
  }

  @Get('companies/:slug')
  @ApiOperation({ summary: 'Get a company with the current user progress on its problems' })
  @ApiResponse({ status: 200, type: CompanyResponseDto })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async getCompany(
    @Param('slug') slug: string,
    @Req() req: RequestWithUser,
  ): Promise<CompanyResponseDto> {
    const company = await this.taxonomyService.getCompany(slug, req.user.getId());
    return TaxonomyPresentationMapper.toCompanyResponse(company);
  }
}
