import { Injectable } from '@nestjs/common';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HarnessFile } from './harness-builder';

@Injectable()
export class WorkdirManager {
  async create(files: HarnessFile[]): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'elevate-sandbox-'));
    await Promise.all(files.map((file) => writeFile(join(dir, file.name), file.content, 'utf8')));
    return dir;
  }

  async cleanup(dir: string): Promise<void> {
    await rm(dir, { recursive: true, force: true });
  }
}
