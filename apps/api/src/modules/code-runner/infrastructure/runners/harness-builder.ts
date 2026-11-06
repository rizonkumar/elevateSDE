import { RunSpec } from '../../domain/value-objects/run-spec';
import { JS_DRIVER } from '../docker-sandbox/drivers/javascript.driver';
import { PY_DRIVER, PY_PRELUDE } from '../docker-sandbox/drivers/python.driver';
import { CPP_MAIN, CPP_PREFIX } from '../docker-sandbox/drivers/cpp.driver';
import { JAVA_IMPORTS, JAVA_MAIN } from '../docker-sandbox/drivers/java.driver';
import { GO_HEADER, GO_MAIN } from '../docker-sandbox/drivers/go.driver';
import {
  GO_TYPES,
  HarnessType,
  isHarnessType,
} from '../../../problem/domain/languages/harness-types';

export interface HarnessFile {
  name: string;
  content: string;
}

export interface HarnessArtifacts {
  files: HarnessFile[];
}

const CPP_CONVERTERS: Record<string, string> = {
  int: '__toInt',
  long: '__toLong',
  double: '__toDouble',
  bool: '__toBool',
  string: '__toStr',
  'int[]': '__toVecInt',
  'long[]': '__toVecLong',
  'double[]': '__toVecDouble',
  'bool[]': '__toVecBool',
  'string[]': '__toVecStr',
  'int[][]': '__toVecVecInt',
};

const JAVA_CONVERTERS: Record<HarnessType, string> = {
  int: '__toInt',
  long: '__toLong',
  double: '__toDouble',
  bool: '__toBool',
  string: '__toStr',
  'int[]': '__toIntArr',
  'long[]': '__toLongArr',
  'double[]': '__toDoubleArr',
  'bool[]': '__toBoolArr',
  'string[]': '__toStrArr',
  'int[][]': '__toIntMatrix',
};

const JAVA_DECLARED: Record<HarnessType, string> = {
  int: 'int',
  long: 'long',
  double: 'double',
  bool: 'boolean',
  string: 'String',
  'int[]': 'int[]',
  'long[]': 'long[]',
  'double[]': 'double[]',
  'bool[]': 'boolean[]',
  'string[]': 'String[]',
  'int[][]': 'int[][]',
};

function requireHarnessType(type: string, language: string): HarnessType {
  if (!isHarnessType(type)) {
    throw new Error(`Unsupported ${language} parameter type: ${type}`);
  }
  return type;
}

function stripJavaPreamble(code: string): string {
  return code
    .replace(/^[ \t]*package\s+[\w.]+\s*;/m, '')
    .replace(/\bpublic\s+(final\s+)?class\s+Solution\b/, 'class Solution');
}

function stripGoPackage(code: string): string {
  return code.replace(/^[ \t]*package\s+\w+\s*$/m, '');
}

function buildJavaInvoke(spec: RunSpec): string {
  const extractions = spec.harness.paramTypes.map((type, index) => {
    const typed = requireHarnessType(type, 'Java');
    return `    ${JAVA_DECLARED[typed]} __p${index} = ${JAVA_CONVERTERS[typed]}(__args.get(${index}));`;
  });
  const call = spec.harness.paramTypes.map((_, index) => `__p${index}`).join(', ');
  return [
    'static String __elevateInvoke(List<Object> __args) {',
    ...extractions,
    `    Object __r = new Solution().${spec.functionName}(${call});`,
    '    return __ser(__r);',
    '  }',
  ].join('\n');
}

function buildGoInvoke(spec: RunSpec): string {
  const extractions = spec.harness.paramTypes.flatMap((type, index) => {
    const typed = requireHarnessType(type, 'Go');
    return [
      `\tvar __p${index} ${GO_TYPES[typed]}`,
      `\tif err := __elevateArg(args, ${index}, &__p${index}); err != nil {`,
      '\t\treturn "", err',
      '\t}',
    ];
  });
  const call = spec.harness.paramTypes.map((_, index) => `__p${index}`).join(', ');
  return [
    'func __elevateInvoke(args []__elevate_json.RawMessage) (string, error) {',
    ...extractions,
    `\treturn __elevateSerialize(${spec.functionName}(${call}))`,
    '}',
  ].join('\n');
}

function buildCasesJson(spec: RunSpec): string {
  return JSON.stringify(spec.cases.map((testCase) => ({ id: testCase.id, input: testCase.input })));
}

function buildCppInvoke(spec: RunSpec): string {
  const extractions = spec.harness.paramTypes.map((type, index) => {
    const converter = CPP_CONVERTERS[type];
    if (!converter) {
      throw new Error(`Unsupported C++ parameter type: ${type}`);
    }
    return `  auto __p${index} = ${converter}(__args.a[${index}]);`;
  });
  const call = spec.harness.paramTypes.map((_, index) => `__p${index}`).join(', ');
  return [
    'static string __elevate_invoke(JV& __args) {',
    ...extractions,
    `  auto __r = ${spec.functionName}(${call});`,
    '  return __ser(__r);',
    '}',
  ].join('\n');
}

export function buildHarness(spec: RunSpec): HarnessArtifacts {
  const cases: HarnessFile = { name: 'cases.json', content: buildCasesJson(spec) };

  if (spec.language === 'javascript') {
    const driver = JS_DRIVER.replaceAll('__ELEVATE_FN__', spec.functionName);
    return { files: [{ name: 'main.js', content: `${spec.userCode}\n${driver}` }, cases] };
  }

  if (spec.language === 'python') {
    const driver = PY_DRIVER.replaceAll('__ELEVATE_FN__', spec.functionName);
    return {
      files: [{ name: 'main.py', content: `${PY_PRELUDE}${spec.userCode}\n${driver}` }, cases],
    };
  }

  if (spec.language === 'java') {
    const main = JAVA_MAIN.replace('__ELEVATE_INVOKE__', buildJavaInvoke(spec));
    const content = `${JAVA_IMPORTS}\n${stripJavaPreamble(spec.userCode)}\n${main}`;
    return { files: [{ name: 'Main.java', content }, cases] };
  }

  if (spec.language === 'go') {
    const main = GO_MAIN.replace('__ELEVATE_INVOKE__', buildGoInvoke(spec));
    const content = `${GO_HEADER}\n${stripGoPackage(spec.userCode)}\n${main}`;
    return { files: [{ name: 'main.go', content }, cases] };
  }

  const invoke = buildCppInvoke(spec);
  const content = `${CPP_PREFIX}\n${spec.userCode}\n${invoke}\n${CPP_MAIN}`;
  return { files: [{ name: 'main.cpp', content }, cases] };
}
