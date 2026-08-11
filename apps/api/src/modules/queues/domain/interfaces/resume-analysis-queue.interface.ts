export interface ResumeAnalysisJobData {
  resumeId: string;
  userId: string;
  text: string;
}

export abstract class IResumeAnalysisQueue {
  abstract enqueue(data: ResumeAnalysisJobData): Promise<void>;
}
