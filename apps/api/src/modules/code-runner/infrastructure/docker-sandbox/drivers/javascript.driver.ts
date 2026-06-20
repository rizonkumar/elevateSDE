export const JS_RESULT_SENTINEL = '###ELEVATE_RESULT###';

export const JS_DRIVER = `
const __elevate_fs = require('fs');
const __elevate_sentinel = '${JS_RESULT_SENTINEL}';
const __elevate_cases = JSON.parse(__elevate_fs.readFileSync('/sandbox/cases.json', 'utf8'));
for (const __elevate_tc of __elevate_cases) {
  const __elevate_start = process.hrtime.bigint();
  let __elevate_line;
  try {
    const __elevate_args = JSON.parse('[' + __elevate_tc.input + ']');
    const __elevate_out = __ELEVATE_FN__(...__elevate_args);
    const __elevate_ms = Number(process.hrtime.bigint() - __elevate_start) / 1e6;
    __elevate_line = {
      caseId: __elevate_tc.id,
      status: 'ok',
      output: JSON.stringify(__elevate_out === undefined ? null : __elevate_out),
      runtimeMs: __elevate_ms,
      peakMemoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  } catch (__elevate_err) {
    const __elevate_ms = Number(process.hrtime.bigint() - __elevate_start) / 1e6;
    __elevate_line = {
      caseId: __elevate_tc.id,
      status: 'error',
      error: String((__elevate_err && __elevate_err.message) || __elevate_err),
      runtimeMs: __elevate_ms,
      peakMemoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  }
  process.stdout.write(__elevate_sentinel + JSON.stringify(__elevate_line) + '\\n');
}
`;
