export interface MockInterviewScoringJobData {
  sessionId: string;
}

export abstract class IMockInterviewScoringQueue {
  abstract enqueue(data: MockInterviewScoringJobData): Promise<void>;
}
