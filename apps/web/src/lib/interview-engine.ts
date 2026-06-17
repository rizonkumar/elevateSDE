import type { SelectOption } from '@elevatesde/ui';
import type {
  InterviewCompanyStyle,
  InterviewCompetencyScore,
  InterviewCompetencySeverity,
  InterviewConfig,
  InterviewRoleLevel,
  MockInterviewFeedback,
  MockInterviewTopic,
  TranscriptEntry,
} from '@elevatesde/shared-types';

export const TOPIC_OPTIONS: SelectOption[] = [
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'CODING', label: 'Coding' },
  { value: 'DSA', label: 'Data Structures & Algorithms' },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { value: 'JUNIOR', label: 'Junior Engineer' },
  { value: 'MID', label: 'Mid-level Engineer' },
  { value: 'SENIOR', label: 'Senior Engineer' },
  { value: 'STAFF', label: 'Staff Engineer' },
];

export const STYLE_OPTIONS: SelectOption[] = [
  { value: 'GENERIC', label: 'Generic' },
  { value: 'FAANG', label: 'FAANG' },
  { value: 'STARTUP', label: 'High-growth Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export const DURATION_OPTIONS: SelectOption[] = [
  { value: '10', label: '10 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
];

export const TOPIC_LABELS: Record<MockInterviewTopic, string> = {
  SYSTEM_DESIGN: 'System Design',
  BEHAVIORAL: 'Behavioral',
  CODING: 'Coding',
  DSA: 'Data Structures & Algorithms',
};

export const ROLE_LABELS: Record<InterviewRoleLevel, string> = {
  JUNIOR: 'Junior Engineer',
  MID: 'Mid-level Engineer',
  SENIOR: 'Senior Engineer',
  STAFF: 'Staff Engineer',
};

export const STYLE_LABELS: Record<InterviewCompanyStyle, string> = {
  GENERIC: 'Generic',
  FAANG: 'FAANG',
  STARTUP: 'High-growth Startup',
  ENTERPRISE: 'Enterprise',
};

const OPENERS: Record<MockInterviewTopic, string> = {
  SYSTEM_DESIGN:
    'Let us design a URL shortening service like Bitly. Start by walking me through the core requirements and the high-level architecture you have in mind.',
  BEHAVIORAL:
    'Tell me about a time you disagreed with a teammate on a technical decision. How did you handle it, and what was the outcome?',
  CODING:
    'I would like you to design a rate limiter. Before writing code, talk me through the approach and the data structures you would reach for.',
  DSA: 'Given an array of integers, find the length of the longest subarray whose elements sum to a target value. Think out loud as you reason about it.',
};

const FOLLOW_UPS: Record<MockInterviewTopic, string[]> = {
  SYSTEM_DESIGN: [
    'How would you scale the system to handle a hundred million writes per day?',
    'Where would a cache help here, and how would you keep it consistent with the source of truth?',
    'How do you guarantee the generated short codes are unique across multiple application servers?',
    'What happens to in-flight requests when a database node fails? Walk me through your failover story.',
    'How would you monitor this system in production and detect a regression early?',
  ],
  BEHAVIORAL: [
    'What would you do differently if you faced that same situation today?',
    'How did you make sure the rest of the team stayed aligned during that period?',
    'Tell me about the moment you realized your initial approach was wrong. How did you adapt?',
    'How do you give difficult feedback to a peer who is more senior than you?',
    'Describe a project you owned end to end. What were you most proud of?',
  ],
  CODING: [
    'What is the time and space complexity of your current approach?',
    'How would your design change if the limit had to be enforced across a distributed fleet?',
    'Walk me through how you would test this, including the tricky edge cases.',
    'Can you refactor this so the policy is pluggable without touching the core logic?',
    'What breaks first under heavy concurrency, and how would you protect against it?',
  ],
  DSA: [
    'Can you improve the time complexity? What is the bottleneck right now?',
    'How would you handle negative numbers in the input?',
    'Talk me through a concrete example to confirm your indices are correct.',
    'What is the space complexity, and can you reduce it?',
    'How would you adapt the solution if we needed every subarray that meets the target, not just the longest?',
  ],
};

function styleNote(style: InterviewCompanyStyle): string {
  switch (style) {
    case 'FAANG':
      return ' Be precise about scale and trade-offs.';
    case 'STARTUP':
      return ' Optimize for shipping quickly without painting us into a corner.';
    case 'ENTERPRISE':
      return ' Keep reliability, compliance, and maintainability front of mind.';
    default:
      return '';
  }
}

export function getOpeningQuestion(config: InterviewConfig): string {
  return `${OPENERS[config.topic]}${styleNote(config.companyStyle)}`;
}

export function getFollowUp(
  config: InterviewConfig,
  answeredCount: number,
  lastAnswer: string,
): string {
  const bank = FOLLOW_UPS[config.topic];
  const index = Math.min(answeredCount, bank.length - 1);
  const probe =
    lastAnswer.trim().split(/\s+/).filter(Boolean).length < 25
      ? 'Before we move on, can you go a level deeper on that? '
      : '';
  return `${probe}${bank[index]}`;
}

const TOPIC_KEYWORDS: Record<MockInterviewTopic, string[]> = {
  SYSTEM_DESIGN: [
    'scale',
    'cache',
    'database',
    'latency',
    'throughput',
    'shard',
    'replica',
    'queue',
    'consistency',
    'availability',
    'load',
  ],
  BEHAVIORAL: [
    'team',
    'conflict',
    'learned',
    'feedback',
    'ownership',
    'outcome',
    'stakeholder',
    'impact',
    'result',
    'collaborate',
  ],
  CODING: [
    'complexity',
    'edge',
    'test',
    'function',
    'data structure',
    'concurrency',
    'refactor',
    'interface',
    'performance',
  ],
  DSA: [
    'complexity',
    'pointer',
    'hash',
    'array',
    'recursion',
    'iterate',
    'optimal',
    'edge',
    'space',
    'time',
  ],
};

function severityFor(score: number): InterviewCompetencySeverity {
  if (score >= 75) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function generateFeedback(
  config: InterviewConfig,
  transcript: TranscriptEntry[],
): MockInterviewFeedback {
  const answers = transcript.filter((entry) => entry.speaker === 'CANDIDATE' && entry.isFinal);
  const answerCount = answers.length;
  const words = answers.flatMap((entry) => entry.text.trim().split(/\s+/).filter(Boolean));
  const totalWords = words.length;
  const avgWords = answerCount > 0 ? totalWords / answerCount : 0;
  const corpus = answers.map((entry) => entry.text.toLowerCase()).join(' ');
  const keywords = TOPIC_KEYWORDS[config.topic];
  const keywordHits = keywords.filter((keyword) => corpus.includes(keyword)).length;
  const keywordCoverage = keywords.length > 0 ? keywordHits / keywords.length : 0;

  const communication = clamp(40 + Math.min(avgWords, 60) * 0.9);
  const technicalDepth = clamp(30 + keywordCoverage * 60 + Math.min(answerCount, 6) * 2);
  const structure = clamp(35 + Math.min(answerCount, 6) * 9 + Math.min(avgWords, 40) * 0.4);
  const relevance = clamp(45 + keywordCoverage * 45 + Math.min(answerCount, 5) * 2);

  const competencies: InterviewCompetencyScore[] = [
    { label: 'Communication', score: communication, severity: severityFor(communication) },
    { label: 'Technical Depth', score: technicalDepth, severity: severityFor(technicalDepth) },
    { label: 'Structure', score: structure, severity: severityFor(structure) },
    { label: 'Relevance', score: relevance, severity: severityFor(relevance) },
  ];

  const overallScore = clamp(
    competencies.reduce((sum, item) => sum + item.score, 0) / competencies.length,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (communication >= 70) {
    strengths.push('You communicated your reasoning clearly and at a steady pace.');
  } else {
    improvements.push('Expand on your answers — narrate your thinking before jumping to a conclusion.');
  }

  if (technicalDepth >= 70) {
    strengths.push('Strong technical depth: you referenced the right concepts for the topic.');
  } else {
    improvements.push(
      `Bring in more ${TOPIC_LABELS[config.topic].toLowerCase()} fundamentals and concrete trade-offs.`,
    );
  }

  if (structure >= 70) {
    strengths.push('Your answers were well structured and easy to follow.');
  } else {
    improvements.push('Frame answers with a clear structure: requirements, approach, then trade-offs.');
  }

  if (answerCount >= 4) {
    strengths.push('You engaged with the full set of follow-up questions.');
  } else {
    improvements.push('Aim to work through more follow-ups to demonstrate range and stamina.');
  }

  if (strengths.length === 0) {
    strengths.push('You completed the session and stayed engaged with the interviewer.');
  }

  const topCompetency = [...competencies].sort((a, b) => b.score - a.score)[0];
  const summary =
    answerCount === 0
      ? 'No answers were captured this session. Start the microphone or type a response to get scored feedback.'
      : `You answered ${answerCount} question${answerCount === 1 ? '' : 's'} across a ${ROLE_LABELS[config.roleLevel]} ${TOPIC_LABELS[config.topic]} round. Overall you scored ${overallScore}, with your strongest signal in ${(topCompetency?.label ?? 'communication').toLowerCase()}.`;

  return { overallScore, competencies, strengths, improvements, summary };
}
