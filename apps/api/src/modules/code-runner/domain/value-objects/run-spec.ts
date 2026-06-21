import { ProblemHarness, ProblemLanguage } from '../../../problem/domain/entities/problem';

export interface SandboxCase {
  id: string;
  input: string;
}

export interface RunSpec {
  language: ProblemLanguage;
  functionName: string;
  harness: ProblemHarness;
  userCode: string;
  cases: SandboxCase[];
  timeoutMsPerCase: number;
  memoryLimitMb: number;
}
