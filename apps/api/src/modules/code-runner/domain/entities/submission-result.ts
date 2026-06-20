import { TestCaseResultStatus } from '@prisma/client';

export interface SubmissionResultProps {
  id: string;
  testCaseId: string;
  label: string;
  status: TestCaseResultStatus;
  actualOutput: string;
  runtimeMs: number;
  memoryKb: number;
  isHidden: boolean;
}

export class SubmissionResult {
  private constructor(private readonly props: SubmissionResultProps) {}

  static create(props: SubmissionResultProps): SubmissionResult {
    return new SubmissionResult(props);
  }

  static reconstitute(props: SubmissionResultProps): SubmissionResult {
    return new SubmissionResult(props);
  }

  getId(): string {
    return this.props.id;
  }

  getTestCaseId(): string {
    return this.props.testCaseId;
  }

  getLabel(): string {
    return this.props.label;
  }

  getStatus(): TestCaseResultStatus {
    return this.props.status;
  }

  getActualOutput(): string {
    return this.props.actualOutput;
  }

  getRuntimeMs(): number {
    return this.props.runtimeMs;
  }

  getMemoryKb(): number {
    return this.props.memoryKb;
  }

  isHidden(): boolean {
    return this.props.isHidden;
  }
}
