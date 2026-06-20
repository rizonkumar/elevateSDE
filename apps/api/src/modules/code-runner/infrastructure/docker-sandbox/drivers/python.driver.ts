export const PY_RESULT_SENTINEL = '###ELEVATE_RESULT###';

export const PY_DRIVER = `
import json as __elevate_json
import sys as __elevate_sys
import time as __elevate_time
import resource as __elevate_resource

__elevate_sentinel = '${PY_RESULT_SENTINEL}'
with open('/sandbox/cases.json') as __elevate_f:
    __elevate_cases = __elevate_json.load(__elevate_f)
for __elevate_tc in __elevate_cases:
    __elevate_start = __elevate_time.perf_counter()
    try:
        __elevate_args = __elevate_json.loads('[' + __elevate_tc['input'] + ']')
        __elevate_out = __ELEVATE_FN__(*__elevate_args)
        __elevate_ms = (__elevate_time.perf_counter() - __elevate_start) * 1000
        __elevate_line = {
            'caseId': __elevate_tc['id'],
            'status': 'ok',
            'output': __elevate_json.dumps(__elevate_out, separators=(',', ':'), sort_keys=True),
            'runtimeMs': __elevate_ms,
            'peakMemoryKb': int(__elevate_resource.getrusage(__elevate_resource.RUSAGE_SELF).ru_maxrss),
        }
    except Exception as __elevate_err:
        __elevate_ms = (__elevate_time.perf_counter() - __elevate_start) * 1000
        __elevate_line = {
            'caseId': __elevate_tc['id'],
            'status': 'error',
            'error': str(__elevate_err),
            'runtimeMs': __elevate_ms,
            'peakMemoryKb': int(__elevate_resource.getrusage(__elevate_resource.RUSAGE_SELF).ru_maxrss),
        }
    __elevate_sys.stdout.write(__elevate_sentinel + __elevate_json.dumps(__elevate_line) + '\\n')
`;
