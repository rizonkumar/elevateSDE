import { Queue } from 'bullmq';
import { CodeExecutionQueue } from './code-execution.queue';
import { CodeExecutionJobData } from '../domain/interfaces/code-execution-queue.interface';

describe('CodeExecutionQueue', () => {
  it('adds an execute job carrying the submission payload with retry options', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const queue = { add } as unknown as Queue<CodeExecutionJobData>;
    const producer = new CodeExecutionQueue(queue);

    const data: CodeExecutionJobData = {
      submissionId: 's1',
      userId: 'u1',
      problemId: 'p1',
      language: 'javascript',
      code: 'solve()',
    };

    await producer.enqueue(data);

    expect(add).toHaveBeenCalledTimes(1);
    const [jobName, payload, options] = add.mock.calls[0] ?? [];
    expect(jobName).toBe('execute');
    expect(payload).toEqual(data);
    expect(options).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  });
});
