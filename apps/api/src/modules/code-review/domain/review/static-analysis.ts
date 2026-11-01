import { ProblemLanguage } from '../../../problem/domain/entities/problem';

const SORT_CALL =
  /\b(sort|sorted|Arrays\.sort|Collections\.sort|sort\.Ints|sort\.Slice|sort\.Strings)\s*\(|\.sort\s*\(/;
const ALLOCATION =
  /\bnew\s+[A-Z\w<]|\b(HashMap|HashSet|ArrayList|unordered_map|unordered_set|vector<|map<|set<|dict\(|set\(|list\(|defaultdict|Counter|make\(|Map\(|Set\()|=\s*(\{\}|\[\])|:=\s*(map\[|\[\])|\[\s*\w+\s+for\s+/;
const DEBUG_OUTPUT =
  /\b(console\.log|print\s*\(|System\.out\.print|fmt\.Print|cout\s*<<|printf\s*\()/;
const ALLOWED_SHORT_NAMES = new Set(['i', 'j', 'k', 'n', 'm', 'x', 'y', 'l', 'r', '_']);

export interface CodeMetrics {
  maxLoopDepth: number;
  usesSort: boolean;
  allocatesCollections: boolean;
  isRecursive: boolean;
  codeLineCount: number;
  shortNames: string[];
  debugOutputLines: number[];
}

function stripComments(code: string, language: ProblemLanguage): string {
  if (language === 'python') {
    return code
      .split('\n')
      .map((line) => line.replace(/#.*$/, ''))
      .join('\n');
  }
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '');
}

function braceLoopDepth(code: string): number {
  const stack: boolean[] = [];
  let pendingLoop = false;
  let maxDepth = 0;
  const tokens = code.match(/\b(for|while)\b|[{}]/g) ?? [];
  for (const token of tokens) {
    if (token === 'for' || token === 'while') {
      pendingLoop = true;
    } else if (token === '{') {
      stack.push(pendingLoop);
      pendingLoop = false;
      maxDepth = Math.max(maxDepth, stack.filter(Boolean).length);
    } else {
      stack.pop();
    }
  }
  return maxDepth;
}

function indentLoopDepth(code: string): number {
  const stack: { indent: number; loop: boolean }[] = [];
  let maxDepth = 0;
  for (const line of code.split('\n')) {
    if (line.trim().length === 0) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length > 0 && (stack.at(-1)?.indent ?? -1) >= indent) {
      stack.pop();
    }
    const trimmed = line.trimStart();
    const isBlock = trimmed.endsWith(':');
    if (isBlock) {
      const loop = /^(for|while)\b/.test(trimmed);
      stack.push({ indent, loop });
      maxDepth = Math.max(maxDepth, stack.filter((entry) => entry.loop).length);
    }
  }
  return maxDepth;
}

function isRecursive(code: string, functionName: string): boolean {
  const occurrences = code.match(new RegExp(`\\b${functionName}\\s*\\(`, 'g')) ?? [];
  return occurrences.length >= 2;
}

function shortNames(code: string): string[] {
  const names = new Set<string>();
  const pattern =
    /\b(?:let|const|var|int|long|double|auto|String|boolean|bool)\s+([A-Za-z_])\b|\b([A-Za-z_])\s*(?::=|=(?!=))/g;
  for (const match of code.matchAll(pattern)) {
    const name = match[1] ?? match[2];
    if (name && !ALLOWED_SHORT_NAMES.has(name)) {
      names.add(name);
    }
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

export function analyzeCode(
  code: string,
  language: ProblemLanguage,
  functionName: string,
): CodeMetrics {
  const cleaned = stripComments(code, language);
  const lines = cleaned.split('\n');
  return {
    maxLoopDepth: language === 'python' ? indentLoopDepth(cleaned) : braceLoopDepth(cleaned),
    usesSort: SORT_CALL.test(cleaned),
    allocatesCollections: ALLOCATION.test(cleaned),
    isRecursive: isRecursive(cleaned, functionName),
    codeLineCount: lines.filter((line) => line.trim().length > 0).length,
    shortNames: shortNames(cleaned),
    debugOutputLines: lines.flatMap((line, index) => (DEBUG_OUTPUT.test(line) ? [index + 1] : [])),
  };
}

export function estimateTimeComplexity(metrics: CodeMetrics): string {
  if (metrics.maxLoopDepth >= 3) return `O(n^${metrics.maxLoopDepth})`;
  if (metrics.maxLoopDepth === 2) return 'O(n^2)';
  if (metrics.usesSort) return 'O(n log n)';
  if (metrics.maxLoopDepth === 1 || metrics.isRecursive) return 'O(n)';
  return 'O(1)';
}

export function estimateSpaceComplexity(metrics: CodeMetrics): string {
  if (metrics.allocatesCollections || metrics.isRecursive) return 'O(n)';
  return 'O(1)';
}
