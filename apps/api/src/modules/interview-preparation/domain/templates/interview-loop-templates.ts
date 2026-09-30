import type {
  InterviewLoopTemplateDto,
  InterviewPreparationArchetype,
  PreparationTaskType,
} from '@elevatesde/shared-types';

const COMMON_TASKS: Record<string, PreparationTaskType[]> = {
  coding: ['SOLVE_PROBLEM', 'REVIEW_PROBLEM'],
  design: ['COMPLETE_PATH', 'RUN_MOCK_INTERVIEW'],
  behavioral: ['RUN_MOCK_INTERVIEW', 'SCHEDULE_PEER_PRACTICE'],
  roleFit: ['ANALYZE_RESUME', 'RUN_MOCK_INTERVIEW'],
};

const TEMPLATES: Record<InterviewPreparationArchetype, InterviewLoopTemplateDto> = {
  GENERAL: {
    archetype: 'GENERAL',
    title: 'General software engineering',
    description: 'A balanced loop covering technical execution, communication, and role alignment.',
    rounds: [
      { type: 'CODING', title: 'Coding', weight: 1.2, suggestedTaskTypes: COMMON_TASKS.coding ?? [] },
      { type: 'SYSTEM_DESIGN', title: 'System design', weight: 1, suggestedTaskTypes: COMMON_TASKS.design ?? [] },
      { type: 'BEHAVIORAL', title: 'Behavioral', weight: 0.9, suggestedTaskTypes: COMMON_TASKS.behavioral ?? [] },
      { type: 'RESUME_ROLE_FIT', title: 'Resume and role fit', weight: 0.9, suggestedTaskTypes: COMMON_TASKS.roleFit ?? [] },
    ],
  },
  FAANG: {
    archetype: 'FAANG',
    title: 'FAANG-style',
    description: 'A coding-heavy loop with system design, behavioral signals, and role alignment.',
    rounds: [
      { type: 'CODING', title: 'Coding', weight: 1.5, suggestedTaskTypes: COMMON_TASKS.coding ?? [] },
      { type: 'SYSTEM_DESIGN', title: 'System design', weight: 1.2, suggestedTaskTypes: COMMON_TASKS.design ?? [] },
      { type: 'BEHAVIORAL', title: 'Behavioral', weight: 1, suggestedTaskTypes: COMMON_TASKS.behavioral ?? [] },
      { type: 'RESUME_ROLE_FIT', title: 'Resume and role fit', weight: 0.8, suggestedTaskTypes: COMMON_TASKS.roleFit ?? [] },
    ],
  },
  STARTUP: {
    archetype: 'STARTUP',
    title: 'Startup',
    description: 'A practical loop emphasizing execution, architecture judgment, and ownership stories.',
    rounds: [
      { type: 'CODING', title: 'Practical coding', weight: 1.2, suggestedTaskTypes: COMMON_TASKS.coding ?? [] },
      { type: 'SYSTEM_DESIGN', title: 'Architecture and tradeoffs', weight: 1.2, suggestedTaskTypes: COMMON_TASKS.design ?? [] },
      { type: 'BEHAVIORAL', title: 'Ownership and collaboration', weight: 1.1, suggestedTaskTypes: COMMON_TASKS.behavioral ?? [] },
      { type: 'RESUME_ROLE_FIT', title: 'Role fit', weight: 0.8, suggestedTaskTypes: COMMON_TASKS.roleFit ?? [] },
    ],
  },
  ENTERPRISE: {
    archetype: 'ENTERPRISE',
    title: 'Enterprise',
    description: 'A structured loop covering reliable delivery, systems thinking, and cross-team communication.',
    rounds: [
      { type: 'CODING', title: 'Technical exercise', weight: 1, suggestedTaskTypes: COMMON_TASKS.coding ?? [] },
      { type: 'SYSTEM_DESIGN', title: 'System design', weight: 1.3, suggestedTaskTypes: COMMON_TASKS.design ?? [] },
      { type: 'BEHAVIORAL', title: 'Collaboration and delivery', weight: 1.2, suggestedTaskTypes: COMMON_TASKS.behavioral ?? [] },
      { type: 'RESUME_ROLE_FIT', title: 'Experience alignment', weight: 1, suggestedTaskTypes: COMMON_TASKS.roleFit ?? [] },
    ],
  },
};

export function getInterviewLoopTemplates(): InterviewLoopTemplateDto[] {
  return Object.values(TEMPLATES).map((template) => ({
    ...template,
    rounds: template.rounds.map((round) => ({
      ...round,
      suggestedTaskTypes: [...round.suggestedTaskTypes],
    })),
  }));
}

export function getInterviewLoopTemplate(
  archetype: InterviewPreparationArchetype,
): InterviewLoopTemplateDto {
  const template = TEMPLATES[archetype];
  return {
    ...template,
    rounds: template.rounds.map((round) => ({
      ...round,
      suggestedTaskTypes: [...round.suggestedTaskTypes],
    })),
  };
}
