import { Injectable } from '@nestjs/common';
import { CodeReviewRequest } from '../../domain/interfaces/code-reviewer.interface';
import { CodeReviewResult, ReviewFinding } from '../../domain/review/code-review-result';
import {
  analyzeCode,
  estimateSpaceComplexity,
  estimateTimeComplexity,
} from '../../domain/review/static-analysis';

const LONG_SOLUTION_LINES = 40;
const MAX_REPORTED_FAILURES = 3;
const MAX_ECHOED_VALUE_LENGTH = 120;

function clip(value: string): string {
  return value.length > MAX_ECHOED_VALUE_LENGTH
    ? `${value.slice(0, MAX_ECHOED_VALUE_LENGTH)}…`
    : value;
}

function verdictFindings(request: CodeReviewRequest): ReviewFinding[] {
  const findings: ReviewFinding[] = request.failingVisibleCases
    .slice(0, MAX_REPORTED_FAILURES)
    .map((failure) => ({
      category: 'EDGE_CASE',
      severity: 'ISSUE',
      line: null,
      message: `${failure.label} fails: for input ${clip(failure.input)} the expected output is ${clip(failure.expectedOutput)}, but the code returned ${clip(failure.actualOutput || 'nothing')}.`,
      suggestion: 'Trace this input by hand through your code to find where the result diverges.',
    }));

  if (request.verdict === 'WRONG_ANSWER' && request.failingVisibleCases.length === 0) {
    findings.push({
      category: 'EDGE_CASE',
      severity: 'ISSUE',
      line: null,
      message: `All visible cases pass, but ${request.hiddenCasesFailed} hidden case(s) fail.`,
      suggestion:
        'Check empty or single-element input, duplicates, negative numbers and values at the limits of the constraints.',
    });
  }
  if (request.verdict === 'TIME_LIMIT_EXCEEDED') {
    findings.push({
      category: 'PERFORMANCE',
      severity: 'ISSUE',
      line: null,
      message: 'The solution exceeded the time limit on at least one test case.',
      suggestion:
        'Look for repeated work inside loops; a hash map, sorting or two pointers often removes a nested loop.',
    });
  }
  if (request.verdict === 'RUNTIME_ERROR') {
    findings.push({
      category: 'CORRECTNESS',
      severity: 'ISSUE',
      line: null,
      message: 'The code crashed on at least one test case.',
      suggestion:
        'Guard index access and null or empty values, and watch for integer overflow or unbounded recursion.',
    });
  }
  return findings;
}

@Injectable()
export class DeterministicCodeReviewer {
  review(request: CodeReviewRequest): CodeReviewResult {
    const metrics = analyzeCode(request.code, request.language, request.functionName);
    const findings = verdictFindings(request);

    if (metrics.maxLoopDepth >= 2) {
      findings.push({
        category: 'COMPLEXITY',
        severity: request.verdict === 'TIME_LIMIT_EXCEEDED' ? 'ISSUE' : 'SUGGESTION',
        line: null,
        message: `Loops are nested ${metrics.maxLoopDepth} deep, so the running time grows roughly as ${estimateTimeComplexity(metrics)}.`,
        suggestion:
          'Consider whether a lookup table, sorting first, or a sliding window can replace the inner loop.',
      });
    }
    if (metrics.codeLineCount > LONG_SOLUTION_LINES) {
      findings.push({
        category: 'READABILITY',
        severity: 'SUGGESTION',
        line: null,
        message: `The solution is ${metrics.codeLineCount} lines long.`,
        suggestion:
          'Extract well-named helper functions so each step is easier to follow and test.',
      });
    }
    if (metrics.shortNames.length >= 2) {
      findings.push({
        category: 'READABILITY',
        severity: 'INFO',
        line: null,
        message: `Single-letter names such as ${metrics.shortNames.slice(0, 4).join(', ')} make the intent harder to read.`,
        suggestion: 'Use names that describe what each value holds.',
      });
    }
    const firstDebugLine = metrics.debugOutputLines[0];
    if (firstDebugLine !== undefined) {
      findings.push({
        category: 'READABILITY',
        severity: 'INFO',
        line: firstDebugLine,
        message: 'The code still prints debug output.',
        suggestion: 'Remove print statements before submitting; they add noise and cost time.',
      });
    }

    return {
      timeComplexity: estimateTimeComplexity(metrics),
      spaceComplexity: estimateSpaceComplexity(metrics),
      summary: summarize(request, findings.length),
      findings: findings.slice(0, 10),
    };
  }
}

function summarize(request: CodeReviewRequest, findingCount: number): string {
  const verdict =
    request.verdict === 'ACCEPTED'
      ? `Accepted, passing all ${request.totalCount} test cases.`
      : `Passed ${request.passedCount} of ${request.totalCount} test cases.`;
  const followUp =
    findingCount === 0
      ? 'No obvious problems were detected by the automated checks.'
      : `The automated checks found ${findingCount} thing(s) worth a look.`;
  return `${verdict} ${followUp} Complexity figures are estimated from the code structure.`;
}
