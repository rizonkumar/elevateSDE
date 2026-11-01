import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { TaxonomyService } from '../../application/taxonomy.service';
import { SaveTaxonomyTermDto } from '../dtos/save-taxonomy-term.dto';
import { TaxonomyTermResponseDto } from '../dtos/taxonomy-response.dto';
import { TaxonomyPresentationMapper } from '../mappers/taxonomy-presentation.mapper';

@ApiTags('Taxonomy (Admin)')
@ApiBearerAuth()
@Controller({ path: 'admin/companies', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CompaniesAdminController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  @ApiOperation({ summary: 'List all companies with problem counts' })
  @ApiResponse({ status: 200, type: [TaxonomyTermResponseDto] })
  async list(): Promise<TaxonomyTermResponseDto[]> {
    const terms = await this.taxonomyService.listForAdmin('company');
    return terms.map((term) => TaxonomyPresentationMapper.toTermResponse(term));
  }

  @Post()
  @ApiOperation({ summary: 'Create a company' })
  @ApiResponse({ status: 201, type: TaxonomyTermResponseDto })
  @ApiResponse({ status: 409, description: 'Name already in use.' })
  async create(@Body() dto: SaveTaxonomyTermDto): Promise<TaxonomyTermResponseDto> {
    const term = await this.taxonomyService.create('company', dto.name);
    return TaxonomyPresentationMapper.toTermResponse(term);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a company' })
  @ApiResponse({ status: 200, type: TaxonomyTermResponseDto })
  @ApiResponse({ status: 409, description: 'Name already in use.' })
  async rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveTaxonomyTermDto,
  ): Promise<TaxonomyTermResponseDto> {
    const term = await this.taxonomyService.rename('company', id, dto.name);
    return TaxonomyPresentationMapper.toTermResponse(term);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a company and remove it from every problem' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.taxonomyService.delete('company', id);
  }
}
