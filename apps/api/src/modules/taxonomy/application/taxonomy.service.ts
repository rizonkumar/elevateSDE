import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintViolation } from '../../../infrastructure/prisma/prisma-errors';
import { ITaxonomyRepository } from '../domain/interfaces/taxonomy-repository.interface';
import { TaxonomyKind, TaxonomyTerm } from '../domain/entities/taxonomy-term';
import { CompanyProgressView, TaxonomyTermView } from '../domain/read-models/taxonomy-views';

const KIND_LABEL: Record<TaxonomyKind, string> = {
  topic: 'topic',
  company: 'company',
};

@Injectable()
export class TaxonomyService {
  constructor(private readonly repository: ITaxonomyRepository) {}

  async listTopics(): Promise<TaxonomyTermView[]> {
    return this.repository.listPublishedTopics();
  }

  async listCompanies(viewerId: string): Promise<CompanyProgressView[]> {
    return this.repository.listCompaniesWithProgress(viewerId);
  }

  async getCompany(slug: string, viewerId: string): Promise<CompanyProgressView> {
    const company = await this.repository.findCompanyWithProgress(slug, viewerId);
    if (!company || company.problemCount === 0) {
      throw new NotFoundException('Company not found.');
    }
    return company;
  }

  async listForAdmin(kind: TaxonomyKind): Promise<TaxonomyTermView[]> {
    return this.repository.listForAdmin(kind);
  }

  async create(kind: TaxonomyKind, name: string): Promise<TaxonomyTermView> {
    const term = toTerm(name);
    try {
      return await this.repository.create(kind, term);
    } catch (error) {
      throw translateWriteError(error, kind, term);
    }
  }

  async rename(kind: TaxonomyKind, id: string, name: string): Promise<TaxonomyTermView> {
    await this.assertExists(kind, id);
    const term = toTerm(name);
    try {
      return await this.repository.rename(kind, id, term);
    } catch (error) {
      throw translateWriteError(error, kind, term);
    }
  }

  async delete(kind: TaxonomyKind, id: string): Promise<void> {
    await this.assertExists(kind, id);
    await this.repository.delete(kind, id);
  }

  private async assertExists(kind: TaxonomyKind, id: string): Promise<void> {
    if (!(await this.repository.exists(kind, id))) {
      throw new NotFoundException(`That ${KIND_LABEL[kind]} does not exist.`);
    }
  }
}

function toTerm(name: string): TaxonomyTerm {
  try {
    return TaxonomyTerm.fromName(name);
  } catch (error) {
    throw new BadRequestException(error instanceof Error ? error.message : 'Invalid name.');
  }
}

function translateWriteError(error: unknown, kind: TaxonomyKind, term: TaxonomyTerm): unknown {
  if (isUniqueConstraintViolation(error)) {
    return new ConflictException(`A ${KIND_LABEL[kind]} named "${term.getName()}" already exists.`);
  }
  return error;
}
