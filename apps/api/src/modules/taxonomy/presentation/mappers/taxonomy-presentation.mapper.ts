import { CompanyProgressView, TaxonomyTermView } from '../../domain/read-models/taxonomy-views';
import { CompanyResponseDto, TaxonomyTermResponseDto } from '../dtos/taxonomy-response.dto';

export class TaxonomyPresentationMapper {
  static toTermResponse(view: TaxonomyTermView): TaxonomyTermResponseDto {
    const dto = new TaxonomyTermResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.name = view.name;
    dto.problemCount = view.problemCount;
    return dto;
  }

  static toCompanyResponse(view: CompanyProgressView): CompanyResponseDto {
    const dto = new CompanyResponseDto();
    dto.id = view.id;
    dto.slug = view.slug;
    dto.name = view.name;
    dto.problemCount = view.problemCount;
    dto.solvedCount = view.solvedCount;
    return dto;
  }
}
