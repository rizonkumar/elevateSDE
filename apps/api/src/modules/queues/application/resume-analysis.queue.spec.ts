import { Queue } from 'bullmq';
import { ResumeAnalysisQueue } from './resume-analysis.queue';
import { ResumeAnalysisJobData } from '../domain/interfaces/resume-analysis-queue.interface';

describe('ResumeAnalysisQueue', () => {
  it('adds an analyze job carrying the extracted text with retry options', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const queue = { add } as unknown as Queue<ResumeAnalysisJobData>;
    const producer = new ResumeAnalysisQueue(queue);

    const data: ResumeAnalysisJobData = {
      resumeId: 'r1',
      userId: 'u1',
      text: 'Experienced software engineer...',
    };

    await producer.enqueue(data);

    expect(add).toHaveBeenCalledTimes(1);
    const [jobName, payload, options] = add.mock.calls[0] ?? [];
    expect(jobName).toBe('analyze');
    expect(payload).toEqual(data);
    expect(options).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });
  });
});
