import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProblemProgressStatus } from '@elevatesde/shared-types';
import { LanguageCodeMap, PROBLEM_LANGUAGES, Problem } from '../domain/entities/problem';
import {
  IProblemRepository,
  ProblemListFilter,
  ProblemListResult,
  ProblemWriteInput,
} from '../domain/interfaces/problem-repository.interface';

export interface ProblemListEntry {
  problem: Problem;
  status: ProblemProgressStatus;
}

export interface ProblemListPage {
  items: ProblemListEntry[];
  total: number;
}

const MAX_STARTER_CODE_LENGTH = 20000;
const KNOWN_LANGUAGES = new Set<string>(PROBLEM_LANGUAGES);

@Injectable()
export class ProblemService {
  constructor(private readonly problemRepository: IProblemRepository) {}

  async list(filter: ProblemListFilter & { viewerId: string }): Promise<ProblemListPage> {
    const result = await this.problemRepository.findPublished(filter);
    const statuses = await this.problemRepository.findViewerStatuses(
      filter.viewerId,
      result.items.map((problem) => problem.getId()),
    );
    return {
      items: result.items.map((problem) => ({
        problem,
        status: statuses.get(problem.getId()) ?? 'TODO',
      })),
      total: result.total,
    };
  }

  async getById(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findById(id);
    if (!problem?.isPublished()) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async listForAdmin(filter: ProblemListFilter): Promise<ProblemListResult> {
    return this.problemRepository.findAll(filter);
  }

  async getByIdForAdmin(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new NotFoundException('Problem not found');
    }
    return problem;
  }

  async create(input: ProblemWriteInput): Promise<Problem> {
    return this.problemRepository.create(await this.validateTaxonomy(input));
  }

  async update(id: string, input: Partial<ProblemWriteInput>): Promise<Problem> {
    const existing = await this.getByIdForAdmin(id);
    const merged: ProblemWriteInput = {
      title: input.title ?? existing.getTitle(),
      difficulty: input.difficulty ?? existing.getDifficulty(),
      description: input.description ?? existing.getDescription(),
      constraints: input.constraints ?? existing.getConstraints(),
      topicIds: input.topicIds ?? existing.getTopics().map((topic) => topic.id),
      companies:
        input.companies ??
        existing.getCompanies().map((company) => ({
          companyId: company.id,
          frequency: company.frequency,
        })),
      starterCode: input.starterCode ?? existing.getStarterCode(),
      timeLimitMinutes: input.timeLimitMinutes ?? existing.getTimeLimitMinutes(),
      isPublished: input.isPublished ?? existing.isPublished(),
      testCases:
        input.testCases ??
        existing.getTestCases().map((testCase) => ({
          input: testCase.getInput(),
          expectedOutput: testCase.getExpectedOutput(),
          isHidden: testCase.isHidden(),
        })),
    };
    return this.problemRepository.update(id, await this.validateTaxonomy(merged));
  }

  async setPublished(id: string, isPublished: boolean): Promise<Problem> {
    await this.getByIdForAdmin(id);
    return this.problemRepository.setPublished(id, isPublished);
  }

  async remove(id: string): Promise<void> {
    await this.getByIdForAdmin(id);
    await this.problemRepository.delete(id);
  }

  private async validateTaxonomy(input: ProblemWriteInput): Promise<ProblemWriteInput> {
    const topicIds = [...new Set(input.topicIds)];
    const companyIds = input.companies.map((company) => company.companyId);
    if (new Set(companyIds).size !== companyIds.length) {
      throw new BadRequestException('Each company can only be added to a problem once.');
    }
    const [topicCount, companyCount] = await Promise.all([
      this.problemRepository.countExistingTopics(topicIds),
      this.problemRepository.countExistingCompanies(companyIds),
    ]);
    if (topicCount !== topicIds.length) {
      throw new BadRequestException('One or more topics do not exist.');
    }
    if (companyCount !== companyIds.length) {
      throw new BadRequestException('One or more companies do not exist.');
    }
    return { ...input, topicIds, starterCode: normalizeStarterCode(input.starterCode) };
  }
}

function normalizeStarterCode(starterCode: Partial<LanguageCodeMap>): Partial<LanguageCodeMap> {
  const normalized: Partial<LanguageCodeMap> = {};
  for (const [language, code] of Object.entries(starterCode)) {
    if (!KNOWN_LANGUAGES.has(language)) {
      throw new BadRequestException(`Unknown starter code language: ${language}.`);
    }
    if (typeof code !== 'string') {
      throw new BadRequestException(`Starter code for ${language} must be text.`);
    }
    if (code.length > MAX_STARTER_CODE_LENGTH) {
      throw new BadRequestException(
        `Starter code for ${language} must be at most ${MAX_STARTER_CODE_LENGTH} characters.`,
      );
    }
    if (code.trim().length > 0) {
      normalized[language as keyof LanguageCodeMap] = code;
    }
  }
  return normalized;
}
