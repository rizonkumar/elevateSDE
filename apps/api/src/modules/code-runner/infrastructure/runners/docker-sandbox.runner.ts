import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ISandboxRunner } from '../../domain/interfaces/sandbox-runner.interface';
import { RunSpec } from '../../domain/value-objects/run-spec';
import { RawCaseResult, RawRunOutput } from '../../domain/value-objects/raw-run-output';
import { buildHarness } from './harness-builder';
import { WorkdirManager } from './workdir.manager';
import { LANGUAGE_IMAGES } from '../docker-sandbox/images.config';
import { buildDockerRunArgs } from '../docker-sandbox/run-flags';
import { JS_RESULT_SENTINEL } from '../docker-sandbox/drivers/javascript.driver';

const MAX_OUTPUT_BYTES = 512 * 1024;
const COMPILE_TIMEOUT_MS = 20000;
const WALL_SLACK_MS = 4000;

interface DockerExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
  timedOut: boolean;
  wallMs: number;
}

@Injectable()
export class DockerSandboxRunner extends ISandboxRunner {
  constructor(private readonly workdir: WorkdirManager) {
    super();
  }

  async run(spec: RunSpec): Promise<RawRunOutput> {
    const artifacts = buildHarness(spec);
    const dir = await this.workdir.create(artifacts.files);
    const config = LANGUAGE_IMAGES[spec.language];
    try {
      if (config.compile) {
        const compileName = `elevate-${randomUUID()}`;
        const compileArgs = buildDockerRunArgs({
          image: config.image,
          workDir: dir,
          memoryMb: spec.memoryLimitMb,
          name: compileName,
          readOnly: false,
          command: config.compile,
        });
        const compiled = await this.exec(compileArgs, COMPILE_TIMEOUT_MS, compileName);
        if (compiled.timedOut || compiled.code !== 0) {
          return {
            caseResults: [],
            userStdout: '',
            exitCode: compiled.code,
            timedOut: compiled.timedOut,
            wallMs: compiled.wallMs,
            compileError: compiled.stderr.trim() || 'Compilation failed',
          };
        }
      }

      const runName = `elevate-${randomUUID()}`;
      const wallTimeout = spec.timeoutMsPerCase * Math.max(1, spec.cases.length) + WALL_SLACK_MS;
      const runArgs = buildDockerRunArgs({
        image: config.image,
        workDir: dir,
        memoryMb: spec.memoryLimitMb,
        name: runName,
        readOnly: true,
        command: config.run,
      });
      const executed = await this.exec(runArgs, wallTimeout, runName);
      const parsed = this.parseStdout(executed.stdout);
      return {
        caseResults: parsed.caseResults,
        userStdout: parsed.userStdout,
        exitCode: executed.code,
        timedOut: executed.timedOut,
        wallMs: executed.wallMs,
        compileError: null,
      };
    } finally {
      await this.workdir.cleanup(dir);
    }
  }

  private exec(args: string[], timeoutMs: number, containerName: string): Promise<DockerExecResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      const child = spawn('docker', args);
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;

      const finish = (code: number | null) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, code, timedOut, wallMs: Date.now() - start });
      };

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        const remover = spawn('docker', ['rm', '-f', containerName]);
        remover.on('error', () => undefined);
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT_BYTES) {
          stdout += chunk.toString();
        }
      });
      child.stderr.on('data', (chunk: Buffer) => {
        if (stderr.length < MAX_OUTPUT_BYTES) {
          stderr += chunk.toString();
        }
      });
      child.on('close', (code) => finish(code));
      child.on('error', () => finish(null));
    });
  }

  private parseStdout(stdout: string): { caseResults: RawCaseResult[]; userStdout: string } {
    const caseResults: RawCaseResult[] = [];
    const userLines: string[] = [];
    for (const line of stdout.split('\n')) {
      if (line.startsWith(JS_RESULT_SENTINEL)) {
        const payload = line.slice(JS_RESULT_SENTINEL.length);
        try {
          caseResults.push(JSON.parse(payload) as RawCaseResult);
        } catch {
          userLines.push(line);
        }
      } else if (line.length > 0) {
        userLines.push(line);
      }
    }
    return { caseResults, userStdout: userLines.join('\n') };
  }
}
