import { Job } from 'bullmq';
import { MockInterviewScoringJobData } from '../../../queues/domain/interfaces/mock-interview-scoring-queue.interface';
import { MockInterviewService } from '../../application/mock-interview.service';
import { MockInterviewScoringProcessor } from './mock-interview-scoring.processor';

function job(attemptsMade: number): Job<MockInterviewScoringJobData> {
  return {
    id: 'job-1',
    data: { sessionId: 'session-1' },
    attemptsMade,
    opts: { attempts: 3 },
  } as unknown as Job<MockInterviewScoringJobData>;
}

describe('MockInterviewScoringProcessor', () => {
  const service = {
    finalize: jest.fn().mockResolvedValue(undefined),
    finalizeDeterministically: jest.fn().mockResolvedValue(undefined),
  };
  const processor = new MockInterviewScoringProcessor(service as unknown as MockInterviewService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finalizes the session for each job', async () => {
    await processor.process(job(0));

    expect(service.finalize).toHaveBeenCalledWith('session-1');
  });

  it('waits for retries before falling back', async () => {
    await processor.onFailed(job(2));

    expect(service.finalizeDeterministically).not.toHaveBeenCalled();
  });

  it('falls back to a deterministic summary once retries are exhausted', async () => {
    await processor.onFailed(job(3));

    expect(service.finalizeDeterministically).toHaveBeenCalledWith('session-1');
  });
});
