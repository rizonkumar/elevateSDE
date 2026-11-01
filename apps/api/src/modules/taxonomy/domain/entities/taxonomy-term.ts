import { slugify } from '../../../../shared/domain/slugify';

export const MAX_TERM_NAME_LENGTH = 60;

export type TaxonomyKind = 'topic' | 'company';

export class TaxonomyTerm {
  private constructor(
    private readonly name: string,
    private readonly slug: string,
  ) {}

  static fromName(rawName: string): TaxonomyTerm {
    const name = rawName.trim().replace(/\s+/g, ' ');
    if (name.length === 0) {
      throw new RangeError('Name is required.');
    }
    if (name.length > MAX_TERM_NAME_LENGTH) {
      throw new RangeError(`Name must be at most ${MAX_TERM_NAME_LENGTH} characters.`);
    }
    const slug = slugify(name);
    if (slug.length === 0) {
      throw new RangeError('Name must contain at least one letter or digit.');
    }
    return new TaxonomyTerm(name, slug);
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }
}
