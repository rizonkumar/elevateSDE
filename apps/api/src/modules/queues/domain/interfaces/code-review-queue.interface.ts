export interface CodeReviewJobData {
  reviewId: string;
}

export abstract class ICodeReviewQueue {
  abstract enqueue(data: CodeReviewJobData): Promise<void>;
}
