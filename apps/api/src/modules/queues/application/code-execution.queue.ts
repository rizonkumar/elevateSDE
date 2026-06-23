import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../domain/queue-names';
import {
  CodeExecutionJobData,
  ICodeExecutionQueue,
} from '../domain/interfaces/code-execution-queue.interface';

const JOB_NAME = 'execute';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAY_MS = 1000;
const RETAINED_FAILURES = 100;

@Injectable()
export class CodeExecutionQueue implements ICodeExecutionQueue {
  constructor(
    @InjectQueue(QUEUE_NAMES.CODE_EXECUTION)
    private readonly queue: Queue<CodeExecutionJobData>,
  ) {}

  async enqueue(data: CodeExecutionJobData): Promise<void> {
    await this.queue.add(JOB_NAME, data, {
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: BACKOFF_DELAY_MS },
      removeOnComplete: true,
      removeOnFail: RETAINED_FAILURES,
    });
  }
}
