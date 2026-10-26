import { Injectable } from '@nestjs/common';
import type {
  InterviewCompanyStyle,
  InterviewConfig,
  MockInterviewDimensionScores,
  MockInterviewTopic,
} from '@elevatesde/shared-types';
import {
  MockInterviewEvaluation,
  MockInterviewEvaluationRequest,
  MockInterviewNarrative,
  MockInterviewerPort,
  MockInterviewSummaryRequest,
} from '../../domain/interfaces/mock-interviewer.interface';
import { rubricFor } from '../../domain/scoring/mock-interview-scoring';

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
    'How would you support custom aliases and link expiry without slowing down redirects?',
  ],
  BEHAVIORAL: [
    'What would you do differently if you faced that same situation today?',
    'How did you make sure the rest of the team stayed aligned during that period?',
    'Tell me about the moment you realized your initial approach was wrong. How did you adapt?',
    'How do you give difficult feedback to a peer who is more senior than you?',
    'Describe a project you owned end to end. What were you most proud of?',
    'Tell me about a time you had to deliver with incomplete information. How did you decide?',
  ],
  CODING: [
    'What is the time and space complexity of your current approach?',
    'How would your design change if the limit had to be enforced across a distributed fleet?',
    'Walk me through how you would test this, including the tricky edge cases.',
    'Can you refactor this so the policy is pluggable without touching the core logic?',
    'What breaks first under heavy concurrency, and how would you protect against it?',
    'How would you expose the remaining quota to clients without leaking internals?',
  ],
  DSA: [
    'Can you improve the time complexity? What is the bottleneck right now?',
    'How would you handle negative numbers in the input?',
    'Talk me through a concrete example to confirm your indices are correct.',
    'What is the space complexity, and can you reduce it?',
    'How would you adapt the solution if we needed every subarray that meets the target, not just the longest?',
    'How would the approach change if the input arrived as a stream?',
  ],
};

const TOPIC_KEYWORDS: Record<MockInterviewTopic, string[]> = {
  SYSTEM_DESIGN: ['scale', 'cache', 'database', 'latency', 'throughput', 'shard', 'replica', 'queue', 'consistency', 'availability', 'load balancer'],
  BEHAVIORAL: ['team', 'conflict', 'learned', 'feedback', 'ownership', 'outcome', 'stakeholder', 'impact', 'result', 'collaborate'],
  CODING: ['complexity', 'edge', 'test', 'function', 'data structure', 'concurrency', 'refactor', 'interface', 'performance', 'hash'],
  DSA: ['complexity', 'pointer', 'hash', 'array', 'recursion', 'iterate', 'optimal', 'edge', 'space', 'prefix'],
};

const DIMENSION_SIGNALS: Record<string, RegExp[]> = {
  complexity: [/\bo\(/, /complexity/, /linear|logarithmic|quadratic|constant time/, /space/],
  requirements: [/requirement/, /users?\b/, /qps|requests per second|per day/, /read|write/, /assum|estimate/],
  tradeoffs: [/trade-?off/, /instead|versus|vs\b|alternatively/, /because/, /downside|cost/],
  scalability: [/scale|shard|partition/, /replica|replication|failover/, /cache/, /monitor|alert/],
  structure: [/situation|context/, /task|goal/, /\bi (did|decided|built|led|proposed)/, /result|outcome|learned/],
  ownership: [/\bi (owned|led|decided|took|drove)/, /my responsibility|i was responsible/, /mistake|i should have/],
  impact: [/\d+\s?%|\d+x\b/, /reduced|increased|improved|saved|cut/, /customers?|revenue|latency|users/],
};

function styleNote(style: InterviewCompanyStyle): string {
  if (style === 'FAANG') return ' Be precise about scale and trade-offs.';
  if (style === 'STARTUP') return ' Optimize for shipping quickly without painting us into a corner.';
  if (style === 'ENTERPRISE') return ' Keep reliability, compliance, and maintainability front of mind.';
  return '';
}

function levelFromCount(count: number, thresholds: readonly [number, number, number]): number {
  if (count >= thresholds[2]) return 4;
  if (count >= thresholds[1]) return 3;
  if (count >= thresholds[0]) return 2;
  return 1;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

@Injectable()
export class DeterministicMockInterviewer implements MockInterviewerPort {
  openingQuestion(config: InterviewConfig): Promise<string> {
    return Promise.resolve(`${OPENERS[config.topic]}${styleNote(config.companyStyle)}`);
  }

  evaluate(request: MockInterviewEvaluationRequest): Promise<MockInterviewEvaluation> {
    const dimensionScores = this.scoreAnswer(request.config.topic, request.answer);
    return Promise.resolve({
      dimensionScores,
      feedback: this.feedbackFor(request.config.topic, dimensionScores),
      nextQuestion: request.askFollowUp ? this.followUp(request) : null,
    });
  }

  summarize(request: MockInterviewSummaryRequest): Promise<MockInterviewNarrative> {
    return Promise.resolve(this.summarizeSync(request));
  }

  summarizeSync(request: MockInterviewSummaryRequest): MockInterviewNarrative {
    const rubric = rubricFor(request.config.topic);
    const strengths = request.competencies
      .filter((item) => item.score >= 67)
      .map((item) => `${item.label}: ${rubric.find((dimension) => dimension.key === item.key)?.descriptors[2] ?? 'solid performance.'}`)
      .slice(0, 3);
    const improvements = [...request.competencies]
      .sort((a, b) => a.score - b.score)
      .filter((item) => item.score < 67)
      .map((item) => `${item.label}: aim for "${rubric.find((dimension) => dimension.key === item.key)?.descriptors[3] ?? 'a stronger answer.'}"`)
      .slice(0, 3);
    if (strengths.length === 0) {
      strengths.push('You completed the session and engaged with every question you were asked.');
    }
    if (improvements.length === 0) {
      improvements.push('Keep practising at a higher level or a different company style to stretch further.');
    }
    const top = [...request.competencies].sort((a, b) => b.score - a.score)[0];
    const count = request.exchanges.length;
    const summary = `You answered ${count} question${count === 1 ? '' : 's'} and scored ${request.overallScore} overall${top ? `, with your strongest signal in ${top.label.toLowerCase()}` : ''}.`;
    return { summary, strengths, improvements };
  }

  private followUp(request: MockInterviewEvaluationRequest): string {
    const bank = FOLLOW_UPS[request.config.topic];
    const asked = new Set([...request.history.map((exchange) => exchange.question), request.question]);
    const next = bank.find((question) => !asked.has(question)) ?? bank.at(-1) ?? OPENERS[request.config.topic];
    const probe = wordCount(request.answer) < 25 ? 'Before we move on, can you go a level deeper on that? ' : '';
    return `${probe}${next}`;
  }

  private scoreAnswer(topic: MockInterviewTopic, answer: string): MockInterviewDimensionScores {
    const text = answer.toLowerCase();
    const words = wordCount(answer);
    const lengthLevel = levelFromCount(words, [15, 40, 90]);
    const keywordHits = TOPIC_KEYWORDS[topic].filter((keyword) => text.includes(keyword)).length;
    const keywordLevel = levelFromCount(keywordHits, [1, 2, 4]);
    const scores: MockInterviewDimensionScores = {};
    for (const { key } of rubricFor(topic)) {
      const signals = DIMENSION_SIGNALS[key];
      if (key === 'communication') {
        scores[key] = lengthLevel;
      } else if (signals) {
        const signalLevel = levelFromCount(signals.filter((signal) => signal.test(text)).length, [1, 2, 3]);
        scores[key] = Math.max(1, Math.min(4, Math.round((signalLevel + Math.min(lengthLevel, keywordLevel + 1)) / 2)));
      } else {
        scores[key] = Math.max(1, Math.min(4, Math.round((keywordLevel + lengthLevel) / 2)));
      }
    }
    return scores;
  }

  private feedbackFor(topic: MockInterviewTopic, scores: MockInterviewDimensionScores): string {
    const rubric = rubricFor(topic);
    const weakest = [...rubric].sort((a, b) => (scores[a.key] ?? 1) - (scores[b.key] ?? 1))[0];
    if (!weakest) return 'Answer recorded.';
    const level = scores[weakest.key] ?? 1;
    if (level >= 4) return 'Strong answer across every dimension of the rubric.';
    return `To strengthen ${weakest.label.toLowerCase()}, aim for: ${weakest.descriptors[level] ?? weakest.descriptors[3]}`;
  }
}
