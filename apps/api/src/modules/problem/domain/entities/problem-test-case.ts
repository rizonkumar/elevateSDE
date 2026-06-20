export interface ProblemTestCaseProps {
  id: string;
  ordinal: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export class ProblemTestCase {
  private constructor(private readonly props: ProblemTestCaseProps) {}

  static reconstitute(props: ProblemTestCaseProps): ProblemTestCase {
    return new ProblemTestCase(props);
  }

  getId(): string {
    return this.props.id;
  }

  getOrdinal(): number {
    return this.props.ordinal;
  }

  getInput(): string {
    return this.props.input;
  }

  getExpectedOutput(): string {
    return this.props.expectedOutput;
  }

  isHidden(): boolean {
    return this.props.isHidden;
  }
}
