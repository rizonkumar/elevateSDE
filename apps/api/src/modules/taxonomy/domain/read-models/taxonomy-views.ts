export interface TaxonomyTermView {
  id: string;
  slug: string;
  name: string;
  problemCount: number;
}

export interface CompanyProgressView extends TaxonomyTermView {
  solvedCount: number;
}
