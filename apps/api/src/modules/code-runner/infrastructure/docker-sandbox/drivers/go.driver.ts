export const GO_RESULT_SENTINEL = '###ELEVATE_RESULT###';

export const GO_HEADER = `package main

import (
\t__elevate_bufio "bufio"
\t__elevate_fmt "fmt"
\t__elevate_json "encoding/json"
\t__elevate_os "os"
\t__elevate_reflect "reflect"
\t__elevate_strconv "strconv"
\t__elevate_strings "strings"
\t__elevate_time "time"
)
`;

export const GO_MAIN =
  `
type __elevateCase struct {
	ID    string ` +
  '`json:"id"`' +
  `
	Input string ` +
  '`json:"input"`' +
  `
}

type __elevateLine struct {
	CaseID       string  ` +
  '`json:"caseId"`' +
  `
	Status       string  ` +
  '`json:"status"`' +
  `
	Output       string  ` +
  '`json:"output,omitempty"`' +
  `
	Error        string  ` +
  '`json:"error,omitempty"`' +
  `
	RuntimeMs    float64 ` +
  '`json:"runtimeMs"`' +
  `
	PeakMemoryKb int64   ` +
  '`json:"peakMemoryKb"`' +
  `
}

func __elevatePeakMemoryKb() int64 {
	file, err := __elevate_os.Open("/proc/self/status")
	if err != nil {
		return 0
	}
	defer file.Close()
	scanner := __elevate_bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if __elevate_strings.HasPrefix(line, "VmHWM:") {
			fields := __elevate_strings.Fields(line)
			if len(fields) >= 2 {
				value, parseErr := __elevate_strconv.ParseInt(fields[1], 10, 64)
				if parseErr == nil {
					return value
				}
			}
		}
	}
	return 0
}

func __elevateArg(args []__elevate_json.RawMessage, index int, target interface{}) error {
	if index >= len(args) {
		return __elevate_fmt.Errorf("missing argument %d", index)
	}
	return __elevate_json.Unmarshal(args[index], target)
}

func __elevateSerialize(value interface{}) (string, error) {
	reflected := __elevate_reflect.ValueOf(value)
	if reflected.Kind() == __elevate_reflect.Slice && reflected.IsNil() {
		return "[]", nil
	}
	encoded, err := __elevate_json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}

func __elevateRun(input string) (output string, err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = __elevate_fmt.Errorf("panic: %v", recovered)
		}
	}()
	var args []__elevate_json.RawMessage
	if err = __elevate_json.Unmarshal([]byte("["+input+"]"), &args); err != nil {
		return "", err
	}
	return __elevateInvoke(args)
}

__ELEVATE_INVOKE__

func main() {
	content, err := __elevate_os.ReadFile("/sandbox/cases.json")
	if err != nil {
		__elevate_fmt.Fprintln(__elevate_os.Stderr, err)
		__elevate_os.Exit(1)
	}
	var cases []__elevateCase
	if err := __elevate_json.Unmarshal(content, &cases); err != nil {
		__elevate_fmt.Fprintln(__elevate_os.Stderr, err)
		__elevate_os.Exit(1)
	}
	for _, testCase := range cases {
		start := __elevate_time.Now()
		output, runErr := __elevateRun(testCase.Input)
		elapsed := float64(__elevate_time.Since(start).Nanoseconds()) / 1e6
		line := __elevateLine{CaseID: testCase.ID, RuntimeMs: elapsed, PeakMemoryKb: __elevatePeakMemoryKb()}
		if runErr != nil {
			line.Status = "error"
			line.Error = runErr.Error()
		} else {
			line.Status = "ok"
			line.Output = output
		}
		encoded, _ := __elevate_json.Marshal(line)
		__elevate_fmt.Fprintln(__elevate_os.Stdout, "${GO_RESULT_SENTINEL}"+string(encoded))
	}
}
`;
