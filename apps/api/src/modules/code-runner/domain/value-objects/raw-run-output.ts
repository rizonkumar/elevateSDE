export interface RawCaseResult {
  caseId: string;
  status: 'ok' | 'error';
  output?: string;
  error?: string;
  runtimeMs: number;
  peakMemoryKb: number;
}

export interface RawRunOutput {
  caseResults: RawCaseResult[];
  userStdout: string;
  exitCode: number | null;
  timedOut: boolean;
  wallMs: number;
  compileError: string | null;
}
