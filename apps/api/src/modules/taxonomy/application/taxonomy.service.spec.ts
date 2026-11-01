import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ITaxonomyRepository } from '../domain/interfaces/taxonomy-repository.interface';
import { TaxonomyKind, TaxonomyTerm } from '../domain/entities/taxonomy-term';
import { CompanyProgressView, TaxonomyTermView } from '../domain/read-models/taxonomy-views';
import { TaxonomyService } from './taxonomy.service';

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

class FakeTaxonomyRepository implements ITaxonomyRepository {
  terms = new Map<string, TaxonomyTermView & { kind: TaxonomyKind }>();
  company: CompanyProgressView | null = null;
  nextId = 1;

  async listPublishedTopics(): Promise<TaxonomyTermView[]> {
    return [];
  }

  async listCompaniesWithProgress(): Promise<CompanyProgressView[]> {
    return [];
  }

  async findCompanyWithProgress(): Promise<CompanyProgressView | null> {
    return this.company;
  }

  async listForAdmin(kind: TaxonomyKind): Promise<TaxonomyTermView[]> {
    return [...this.terms.values()].filter((term) => term.kind === kind);
  }

  async exists(kind: TaxonomyKind, id: string): Promise<boolean> {
    return this.terms.get(id)?.kind === kind;
  }

  async create(kind: TaxonomyKind, term: TaxonomyTerm): Promise<TaxonomyTermView> {
    this.assertUnique(kind, term.getSlug());
    const view = {
      kind,
      id: `id-${this.nextId++}`,
      slug: term.getSlug(),
      name: term.getName(),
      problemCount: 0,
    };
    this.terms.set(view.id, view);
    return view;
  }

  async rename(kind: TaxonomyKind, id: string, term: TaxonomyTerm): Promise<TaxonomyTermView> {
    this.assertUnique(kind, term.getSlug(), id);
    const existing = this.terms.get(id);
    if (!existing) {
      throw new Error('missing');
    }
    const updated = { ...existing, slug: term.getSlug(), name: term.getName() };
    this.terms.set(id, updated);
    return updated;
  }

  async delete(_kind: TaxonomyKind, id: string): Promise<void> {
    this.terms.delete(id);
  }

  private assertUnique(kind: TaxonomyKind, slug: string, ignoreId?: string): void {
    const clash = [...this.terms.values()].some(
      (term) => term.kind === kind && term.slug === slug && term.id !== ignoreId,
    );
    if (clash) {
      throw uniqueViolation();
    }
  }
}

describe('TaxonomyService', () => {
  let repository: FakeTaxonomyRepository;
  let service: TaxonomyService;

  beforeEach(() => {
    repository = new FakeTaxonomyRepository();
    service = new TaxonomyService(repository);
  });

  it('creates a topic with a normalised name and slug', async () => {
    const topic = await service.create('topic', ' Two  Pointers ');

    expect(topic).toMatchObject({ name: 'Two Pointers', slug: 'two-pointers' });
  });

  it('rejects names that collide on slug within the same kind', async () => {
    await service.create('topic', 'Dynamic Programming');

    await expect(service.create('topic', 'dynamic-programming')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('allows a topic and a company to share a name', async () => {
    await service.create('topic', 'Google');

    await expect(service.create('company', 'Google')).resolves.toMatchObject({ slug: 'google' });
  });

  it('turns invalid names into bad requests', async () => {
    await expect(service.create('company', '   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to rename or delete a term of the wrong kind', async () => {
    const topic = await service.create('topic', 'Graphs');

    await expect(service.rename('company', topic.id, 'Graph')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.delete('company', topic.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides companies that have no published problems', async () => {
    repository.company = {
      id: 'c1',
      slug: 'acme',
      name: 'Acme',
      problemCount: 0,
      solvedCount: 0,
    };

    await expect(service.getCompany('acme', 'viewer')).rejects.toBeInstanceOf(NotFoundException);
  });
});
