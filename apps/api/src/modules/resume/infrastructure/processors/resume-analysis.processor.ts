import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../../queues/domain/queue-names';
import { ResumeAnalysisJobData } from '../../../queues/domain/interfaces/resume-analysis-queue.interface';
import { IResumeAnalyzer } from '../../domain/interfaces/resume-analyzer.interface';
import { ResumeService } from '../../application/resume.service';

const FAILURE_MESSAGE = 'Analysis failed unexpectedly. Please try again.';

@Processor(QUEUE_NAMES.RESUME)
export class ResumeAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(ResumeAnalysisProcessor.name);

  constructor(
    private readonly resumeAnalyzer: IResumeAnalyzer,
    private readonly resumeService: ResumeService,
  ) {
    super();
  }

  async process(job: Job<ResumeAnalysisJobData>): Promise<void> {
    const { resumeId, text } = job.data;
    const result = await this.resumeAnalyzer.analyze(text);
    await this.resumeService.applyResult(resumeId, result);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ResumeAnalysisJobData>): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;
    this.logger.error(`Resume analysis job ${job.id} failed after ${job.attemptsMade} attempts`);
    await this.resumeService.markFailed(job.data.resumeId, FAILURE_MESSAGE);
  }
}
