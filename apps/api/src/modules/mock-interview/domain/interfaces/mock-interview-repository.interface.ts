import type { MockInterviewSummaryDto } from '@elevatesde/shared-types';
import { MockInterviewSession } from '../entities/mock-interview-session';

export interface MockInterviewHistoryPage {
  items: MockInterviewSummaryDto[];
  nextCursor: string | null;
}

export abstract class IMockInterviewRepository {
  abstract findById(id: string): Promise<MockInterviewSession | null>;
  abstract findOwned(userId: string, id: string): Promise<MockInterviewSession | null>;
  abstract findActiveForUser(userId: string): Promise<MockInterviewSession | null>;
  abstract countStartedSince(userId: string, since: Date): Promise<number>;
  abstract isOwnedMockInterviewTask(userId: string, taskId: string): Promise<boolean>;
  abstract createIfNoActive(session: MockInterviewSession): Promise<'CREATED' | 'ACTIVE_EXISTS'>;
  abstract save(session: MockInterviewSession): Promise<'SAVED' | 'VERSION_CONFLICT'>;
  abstract listForUser(userId: string, limit: number, cursor: string | null): Promise<MockInterviewHistoryPage>;
  abstract findOverdueActiveIds(deadlineBefore: Date, limit: number): Promise<string[]>;
  abstract findStaleScoringIds(endedBefore: Date, limit: number): Promise<string[]>;
}
