import type { InterviewConfig } from '@elevatesde/shared-types';
import { DeterministicMockInterviewer } from './deterministic-mock-interviewer';
import { OpenAiCompatibleMockInterviewer } from './openai-compatible-mock-interviewer';
import { ResilientMockInterviewer } from './resilient-mock-interviewer';

const config: InterviewConfig = {
  topic: 'SYSTEM_DESIGN',
  roleLevel: 'SENIOR',
  companyStyle: 'FAANG',
  durationMinutes: 30,
};

function build(configured: boolean): {
  interviewer: ResilientMockInterviewer;
  llm: jest.Mocked<Pick<OpenAiCompatibleMockInterviewer, 'isConfigured' | 'openingQuestion'>>;
} {
  const llm = {
    isConfigured: jest.fn().mockReturnValue(configured),
    openingQuestion: jest.fn().mockResolvedValue('Design a news feed.'),
  };
  const interviewer = new ResilientMockInterviewer(
    llm as unknown as OpenAiCompatibleMockInterviewer,
    new DeterministicMockInterviewer(),
  );
  return { interviewer, llm };
}

describe('ResilientMockInterviewer', () => {
  const previous = process.env.MOCK_INTERVIEW_AI_ENABLED;

  afterEach(() => {
    process.env.MOCK_INTERVIEW_AI_ENABLED = previous;
  });

  it('uses the deterministic interviewer when AI is disabled', async () => {
    process.env.MOCK_INTERVIEW_AI_ENABLED = 'false';
    const { interviewer, llm } = build(true);

    const result = await interviewer.openingQuestion(config);

    expect(interviewer.preferredEngine()).toBe('DETERMINISTIC');
    expect(result.engine).toBe('DETERMINISTIC');
    expect(result.value).toContain('URL shortening');
    expect(llm.openingQuestion).not.toHaveBeenCalled();
  });

  it('uses the deterministic interviewer when the provider is not configured', async () => {
    process.env.MOCK_INTERVIEW_AI_ENABLED = 'true';
    const { interviewer, llm } = build(false);

    await expect(interviewer.openingQuestion(config)).resolves.toMatchObject({ engine: 'DETERMINISTIC' });
    expect(llm.openingQuestion).not.toHaveBeenCalled();
  });

  it('uses the model when enabled and configured', async () => {
    process.env.MOCK_INTERVIEW_AI_ENABLED = 'true';
    const { interviewer } = build(true);

    await expect(interviewer.openingQuestion(config)).resolves.toEqual({
      value: 'Design a news feed.',
      engine: 'LLM',
    });
  });

  it('falls back for a single call when the model fails', async () => {
    process.env.MOCK_INTERVIEW_AI_ENABLED = 'true';
    const { interviewer, llm } = build(true);
    llm.openingQuestion.mockRejectedValueOnce(new Error('timeout'));

    await expect(interviewer.openingQuestion(config)).resolves.toMatchObject({ engine: 'DETERMINISTIC' });
    await expect(interviewer.openingQuestion(config)).resolves.toMatchObject({ engine: 'LLM' });
  });
});
