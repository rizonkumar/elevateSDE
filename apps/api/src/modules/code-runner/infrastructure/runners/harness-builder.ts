import { RunSpec } from '../../domain/value-objects/run-spec';
import { JS_DRIVER } from '../docker-sandbox/drivers/javascript.driver';
import { PY_DRIVER, PY_PRELUDE } from '../docker-sandbox/drivers/python.driver';
import { CPP_MAIN, CPP_PREFIX } from '../docker-sandbox/drivers/cpp.driver';

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
    const driver = JS_DRIVER.replace(/__ELEVATE_FN__/g, spec.functionName);
    return { files: [{ name: 'main.js', content: `${spec.userCode}\n${driver}` }, cases] };
  }

  if (spec.language === 'python') {
    const driver = PY_DRIVER.replace(/__ELEVATE_FN__/g, spec.functionName);
    return {
      files: [{ name: 'main.py', content: `${PY_PRELUDE}${spec.userCode}\n${driver}` }, cases],
    };
  }

  const invoke = buildCppInvoke(spec);
  const content = `${CPP_PREFIX}\n${spec.userCode}\n${invoke}\n${CPP_MAIN}`;
  return { files: [{ name: 'main.cpp', content }, cases] };
}
