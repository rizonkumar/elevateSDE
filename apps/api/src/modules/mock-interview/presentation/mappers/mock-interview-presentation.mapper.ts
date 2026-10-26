import { MOCK_INTERVIEW_MAX_TURNS, type MockInterviewSessionDto } from '@elevatesde/shared-types';
import { MockInterviewSession } from '../../domain/entities/mock-interview-session';

export const MockInterviewPresentationMapper = {
  toDto(session: MockInterviewSession): MockInterviewSessionDto {
    return {
      id: session.getId(),
      config: { ...session.getConfig() },
      status: session.getStatus(),
      engine: session.getEngine(),
      preparationTaskId: session.getPreparationTaskId(),
      startedAt: session.getStartedAt().toISOString(),
      deadlineAt: session.getDeadlineAt().toISOString(),
      endedAt: session.getEndedAt()?.toISOString() ?? null,
      turns: session.getTurns().map((turn) => ({
        id: turn.id,
        ordinal: turn.ordinal,
        question: turn.question,
        askedAt: turn.askedAt.toISOString(),
        answer: turn.answer,
        answeredAt: turn.answeredAt?.toISOString() ?? null,
        score: turn.score,
        dimensionScores: turn.dimensionScores ? { ...turn.dimensionScores } : null,
        feedback: turn.feedback,
      })),
      feedback: session.getReport(),
      failureReason: session.getFailureReason(),
      version: session.getVersion(),
      maxTurns: MOCK_INTERVIEW_MAX_TURNS,
    };
  },
};
