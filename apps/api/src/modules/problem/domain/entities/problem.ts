import { AssessmentDifficulty, ComparisonMode } from '@prisma/client';
import { ProblemTestCase } from './problem-test-case';

export type ProblemLanguage = 'javascript' | 'python' | 'cpp';

export type LanguageCodeMap = Record<ProblemLanguage, string>;

export interface ProblemExample {
  input: string;
  output: string;
  explanation: string | null;
}

export interface ProblemHarness {
  paramTypes: string[];
  returnType: string;
  cpp: { signature: string };
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
  starterCode: LanguageCodeMap;
  examples: ProblemExample[];
  functionName: string;
  harness: ProblemHarness;
  referenceSolution: Partial<LanguageCodeMap>;
  comparisonMode: ComparisonMode;
  timeLimitMinutes: number;
  isPublished: boolean;
  testCases: ProblemTestCase[];
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

  getStarterCode(): LanguageCodeMap {
    return this.props.starterCode;
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

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
