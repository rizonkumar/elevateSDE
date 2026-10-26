import type { InterviewConfig } from '@elevatesde/shared-types';
import { isValidDimensionScores } from '../../domain/scoring/mock-interview-scoring';
import { DeterministicMockInterviewer } from './deterministic-mock-interviewer';

const config: InterviewConfig = {
  topic: 'DSA',
  roleLevel: 'MID',
  companyStyle: 'STARTUP',
  durationMinutes: 20,
};

describe('DeterministicMockInterviewer', () => {
  const interviewer = new DeterministicMockInterviewer();

  it('applies the company style to the opening question', async () => {
    await expect(interviewer.openingQuestion(config)).resolves.toContain('shipping quickly');
  });

  it('returns rubric-valid scores that reward a thorough answer', async () => {
    const thin = await interviewer.evaluate({
      config,
      history: [],
      question: 'q',
      answer: 'Use a loop.',
      askFollowUp: true,
    });
    const thorough = await interviewer.evaluate({
      config,
      history: [],
      question: 'q',
      answer:
        'I would iterate once while keeping a prefix sum in a hash map from sum to earliest index. For each index the subarray ending here hits the target when prefix minus target was seen before, so the time complexity is O(n) and space is O(n). Edge cases include negative numbers, an empty array, and a target of zero, which I would test explicitly before optimizing further.',
      askFollowUp: true,
    });

    expect(isValidDimensionScores('DSA', thin.dimensionScores)).toBe(true);
    expect(isValidDimensionScores('DSA', thorough.dimensionScores)).toBe(true);
    const total = (scores: Record<string, number>): number =>
      Object.values(scores).reduce((sum, value) => sum + value, 0);
    expect(total(thorough.dimensionScores)).toBeGreaterThan(total(thin.dimensionScores));
    expect(thin.nextQuestion).toMatch(/^Before we move on/);
  });

  it('does not repeat questions already asked', async () => {
    const first = await interviewer.evaluate({ config, history: [], question: 'opening', answer: 'answer', askFollowUp: true });
    const second = await interviewer.evaluate({
      config,
      history: [{ question: 'opening', answer: 'answer' }],
      question: first.nextQuestion?.replace(/^Before we move on, can you go a level deeper on that\? /, '') ?? '',
      answer: 'answer',
      askFollowUp: true,
    });

    expect(second.nextQuestion).not.toBe(first.nextQuestion);
  });

  it('omits the follow-up when the interview is ending', async () => {
    const result = await interviewer.evaluate({ config, history: [], question: 'q', answer: 'a', askFollowUp: false });

    expect(result.nextQuestion).toBeNull();
  });

  it('summarizes strengths and improvements from the computed competencies', () => {
    const narrative = interviewer.summarizeSync({
      config,
      exchanges: [{ question: 'q', answer: 'a', score: 60, feedback: 'f' }],
      competencies: [
        { key: 'problemSolving', label: 'Problem Solving', score: 100, severity: 'good' },
        { key: 'complexity', label: 'Complexity Analysis', score: 0, severity: 'critical' },
      ],
      overallScore: 50,
    });

    expect(narrative.strengths[0]).toMatch(/^Problem Solving/);
    expect(narrative.improvements[0]).toMatch(/^Complexity Analysis/);
    expect(narrative.summary).toContain('scored 50 overall');
  });
});
