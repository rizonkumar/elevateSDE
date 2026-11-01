import { AssessmentDifficulty, ComparisonMode } from '@prisma/client';
import { ProblemTestCase } from './problem-test-case';
import { goStub, javaStub, toTypedSignature } from '../languages/starter-stubs';

export const PROBLEM_LANGUAGES = ['javascript', 'python', 'cpp', 'java', 'go'] as const;

export type ProblemLanguage = (typeof PROBLEM_LANGUAGES)[number];

export type LanguageCodeMap = Record<ProblemLanguage, string>;

export interface ProblemExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface ProblemHarness {
  paramTypes: string[];
  returnType: string;
  cpp?: { signature: string };
}

export interface ProblemTopicRef {
  id: string;
  slug: string;
  name: string;
}

export interface ProblemCompanyRef {
  id: string;
  slug: string;
  name: string;
  frequency: number;
}

export interface ProblemProps {
  id: string;
  tenantId: string | null;
  slug: string;
  title: string;
  difficulty: AssessmentDifficulty;
  description: string;
  constraints: string[];
  tags: string[];
  starterCode: Partial<LanguageCodeMap>;
  examples: ProblemExample[];
  functionName: string;
  harness: ProblemHarness;
  referenceSolution: Partial<LanguageCodeMap>;
  comparisonMode: ComparisonMode;
  timeLimitMinutes: number;
  isPublished: boolean;
  testCases: ProblemTestCase[];
  topics: ProblemTopicRef[];
  companies: ProblemCompanyRef[];
  createdAt: Date;
  updatedAt: Date;
}

export class Problem {
  private constructor(private readonly props: ProblemProps) {}

  static reconstitute(props: ProblemProps): Problem {
    return new Problem(props);
  }

  getId(): string {
    return this.props.id;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getSlug(): string {
    return this.props.slug;
  }

  getTitle(): string {
    return this.props.title;
  }

  getDifficulty(): AssessmentDifficulty {
    return this.props.difficulty;
  }

  getDescription(): string {
    return this.props.description;
  }

  getConstraints(): string[] {
    return this.props.constraints;
  }

  getTags(): string[] {
    return this.props.tags;
  }

  getStarterCode(): Partial<LanguageCodeMap> {
    return this.props.starterCode;
  }

  getStarterCodeFor(language: ProblemLanguage): string | null {
    const stored = this.props.starterCode[language];
    if (language !== 'java' && language !== 'go') {
      return stored ?? '';
    }
    if (stored && stored.trim().length > 0) {
      return stored;
    }
    const signature = toTypedSignature(this.props.functionName, this.props.harness);
    if (!signature) {
      return null;
    }
    return language === 'java' ? javaStub(signature) : goStub(signature);
  }

  getAvailableLanguages(): ProblemLanguage[] {
    return PROBLEM_LANGUAGES.filter((language) => this.getStarterCodeFor(language) !== null);
  }

  supportsLanguage(language: ProblemLanguage): boolean {
    return this.getStarterCodeFor(language) !== null;
  }

  getResolvedStarterCode(): Partial<LanguageCodeMap> {
    const resolved: Partial<LanguageCodeMap> = {};
    for (const language of this.getAvailableLanguages()) {
      const code = this.getStarterCodeFor(language);
      if (code !== null) {
        resolved[language] = code;
      }
    }
    return resolved;
  }

  getExamples(): ProblemExample[] {
    return this.props.examples;
  }

  getFunctionName(): string {
    return this.props.functionName;
  }

  getHarness(): ProblemHarness {
    return this.props.harness;
  }

  getReferenceSolution(): Partial<LanguageCodeMap> {
    return this.props.referenceSolution;
  }

  getComparisonMode(): ComparisonMode {
    return this.props.comparisonMode;
  }

  getTimeLimitMinutes(): number {
    return this.props.timeLimitMinutes;
  }

  isPublished(): boolean {
    return this.props.isPublished;
  }

  getTestCases(): ProblemTestCase[] {
    return this.props.testCases;
  }

  getVisibleTestCases(): ProblemTestCase[] {
    return this.props.testCases.filter((testCase) => !testCase.isHidden());
  }

  getTopics(): ProblemTopicRef[] {
    return this.props.topics;
  }

  getCompanies(): ProblemCompanyRef[] {
    return this.props.companies;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
