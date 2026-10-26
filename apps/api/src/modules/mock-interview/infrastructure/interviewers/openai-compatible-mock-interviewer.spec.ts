import {
  MockInterviewProviderError,
  OpenAiCompatibleMockInterviewer,
  parseEvaluation,
  parseNarrative,
  parseOpeningQuestion,
  readProviderConfig,
} from './openai-compatible-mock-interviewer';

const validScores = { structure: 3, ownership: 4, impact: 2, communication: 3 };

describe('OpenAI-compatible mock interviewer parsing', () => {
  it('parses an opening question', () => {
    expect(parseOpeningQuestion(JSON.stringify({ question: '  Tell me about a conflict.  ' }))).toBe(
      'Tell me about a conflict.',
    );
  });

  it.each([
    ['not json', 'not json'],
    ['an array', '[]'],
    ['a missing question', '{}'],
    ['an empty question', JSON.stringify({ question: '   ' })],
    ['an oversized question', JSON.stringify({ question: 'x'.repeat(1001) })],
  ])('rejects %s', (_label, content) => {
    expect(() => parseOpeningQuestion(content)).toThrow(MockInterviewProviderError);
  });

  it('parses a valid evaluation with a follow-up', () => {
    const content = JSON.stringify({
      scores: validScores,
      feedback: 'Quantify the impact.',
      nextQuestion: 'What would you change?',
    });

    expect(parseEvaluation(content, 'BEHAVIORAL', true)).toEqual({
      dimensionScores: validScores,
      feedback: 'Quantify the impact.',
      nextQuestion: 'What would you change?',
    });
  });

  it('drops the follow-up when the interview is ending', () => {
    const content = JSON.stringify({ scores: validScores, feedback: 'Good.', nextQuestion: 'Ignored?' });

    expect(parseEvaluation(content, 'BEHAVIORAL', false).nextQuestion).toBeNull();
  });

  it.each([
    ['scores outside the rubric scale', { scores: { ...validScores, impact: 9 }, feedback: 'x', nextQuestion: 'q' }],
    ['scores for another topic', { scores: { problemSolving: 3, technicalDepth: 3, complexity: 3, communication: 3 }, feedback: 'x', nextQuestion: 'q' }],
    ['a missing follow-up', { scores: validScores, feedback: 'x' }],
    ['missing feedback', { scores: validScores, nextQuestion: 'q' }],
    ['an injected extra score key', { scores: { ...validScores, overall: 4 }, feedback: 'x', nextQuestion: 'q' }],
  ])('rejects an evaluation with %s', (_label, payload) => {
    expect(() => parseEvaluation(JSON.stringify(payload), 'BEHAVIORAL', true)).toThrow(
      MockInterviewProviderError,
    );
  });

  it('caps narrative lists to three valid items', () => {
    const narrative = parseNarrative(
      JSON.stringify({
        summary: 'Solid session.',
        strengths: ['a', 'b', 'c', 'd', 42, ''],
        improvements: ['x'],
      }),
    );

    expect(narrative).toEqual({ summary: 'Solid session.', strengths: ['a', 'b', 'c'], improvements: ['x'] });
  });

  it('rejects a narrative without usable improvements', () => {
    expect(() =>
      parseNarrative(JSON.stringify({ summary: 'ok', strengths: ['a'], improvements: [7] })),
    ).toThrow(MockInterviewProviderError);
  });
});

describe('OpenAI-compatible mock interviewer configuration', () => {
  it('requires endpoint, key and model', () => {
    expect(readProviderConfig({})).toBeNull();
    expect(
      readProviderConfig({ MOCK_INTERVIEW_AI_ENDPOINT: 'https://ai.test', MOCK_INTERVIEW_AI_API_KEY: 'k' }),
    ).toBeNull();
    expect(
      readProviderConfig({
        MOCK_INTERVIEW_AI_ENDPOINT: 'https://ai.test',
        MOCK_INTERVIEW_AI_API_KEY: 'k',
        MOCK_INTERVIEW_AI_MODEL: 'm',
      }),
    ).toEqual({ endpoint: 'https://ai.test', apiKey: 'k', model: 'm' });
  });

  it('fails fast without calling the network when unconfigured', async () => {
    const previous = { ...process.env };
    delete process.env.MOCK_INTERVIEW_AI_ENDPOINT;
    const fetchSpy = jest.spyOn(global, 'fetch');
    try {
      await expect(
        new OpenAiCompatibleMockInterviewer().openingQuestion({
          topic: 'DSA',
          roleLevel: 'JUNIOR',
          companyStyle: 'GENERIC',
          durationMinutes: 10,
        }),
      ).rejects.toThrow('not configured');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
      process.env = previous;
    }
  });
});
