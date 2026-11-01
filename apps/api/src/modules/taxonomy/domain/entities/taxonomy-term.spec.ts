import { MAX_TERM_NAME_LENGTH, TaxonomyTerm } from './taxonomy-term';

describe('TaxonomyTerm', () => {
  it('collapses whitespace and derives a slug', () => {
    const term = TaxonomyTerm.fromName('  Sliding   Window ');

    expect(term.getName()).toBe('Sliding Window');
    expect(term.getSlug()).toBe('sliding-window');
  });

  it('slugs punctuation the same way as the tag backfill', () => {
    expect(TaxonomyTerm.fromName('Hash Map / Set').getSlug()).toBe('hash-map-set');
    expect(TaxonomyTerm.fromName('C++ Specific!').getSlug()).toBe('c-specific');
  });

  it('rejects blank, symbol-only and over-long names', () => {
    expect(() => TaxonomyTerm.fromName('   ')).toThrow(RangeError);
    expect(() => TaxonomyTerm.fromName('+++')).toThrow(RangeError);
    expect(() => TaxonomyTerm.fromName('a'.repeat(MAX_TERM_NAME_LENGTH + 1))).toThrow(RangeError);
  });
});
