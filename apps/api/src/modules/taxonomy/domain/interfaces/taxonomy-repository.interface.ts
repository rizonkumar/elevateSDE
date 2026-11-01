import { TaxonomyKind, TaxonomyTerm } from '../entities/taxonomy-term';
import { CompanyProgressView, TaxonomyTermView } from '../read-models/taxonomy-views';

export abstract class ITaxonomyRepository {
  abstract listPublishedTopics(): Promise<TaxonomyTermView[]>;
  abstract listCompaniesWithProgress(viewerId: string): Promise<CompanyProgressView[]>;
  abstract findCompanyWithProgress(
    slug: string,
    viewerId: string,
  ): Promise<CompanyProgressView | null>;
  abstract listForAdmin(kind: TaxonomyKind): Promise<TaxonomyTermView[]>;
  abstract exists(kind: TaxonomyKind, id: string): Promise<boolean>;
  abstract create(kind: TaxonomyKind, term: TaxonomyTerm): Promise<TaxonomyTermView>;
  abstract rename(kind: TaxonomyKind, id: string, term: TaxonomyTerm): Promise<TaxonomyTermView>;
  abstract delete(kind: TaxonomyKind, id: string): Promise<void>;
}
