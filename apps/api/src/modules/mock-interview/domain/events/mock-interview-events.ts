import type { MockInterviewTopic } from '@elevatesde/shared-types';

export const MOCK_INTERVIEW_EVENTS = {
  COMPLETED: 'mock-interview.completed',
} as const;

export interface MockInterviewCompletedEvent {
  userId: string;
  sessionId: string;
  topic: MockInterviewTopic;
  overallScore: number;
  preparationTaskId: string | null;
}
