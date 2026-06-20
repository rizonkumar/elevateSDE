import type { BadgeVariant } from '@elevatesde/ui';
import type { ResumeFeedbackItem } from '@elevatesde/shared-types';

export interface ResumeAnalysis {
  atsScore: number;
  parsedSkills: string[];
  missingSkills: string[];
  structureFeedback: ResumeFeedbackItem[];
  actionableTips: string[];
  summary: string;
}

interface SkillDefinition {
  name: string;
  keywords: string[];
}

export const SDE_SKILLS: SkillDefinition[] = [
  { name: 'JavaScript', keywords: ['javascript', 'js', 'es6'] },
  { name: 'TypeScript', keywords: ['typescript', 'ts'] },
  { name: 'React', keywords: ['react', 'react.js', 'reactjs'] },
  { name: 'Node.js', keywords: ['node.js', 'nodejs', 'node'] },
  { name: 'Python', keywords: ['python'] },
  { name: 'Java', keywords: ['java'] },
  { name: 'Go', keywords: ['golang'] },
  { name: 'C++', keywords: ['c++'] },
  { name: 'SQL', keywords: ['sql', 'postgresql', 'postgres', 'mysql'] },
  { name: 'NoSQL', keywords: ['mongodb', 'dynamodb', 'redis', 'cassandra'] },
  { name: 'AWS', keywords: ['aws', 'amazon web services'] },
  { name: 'Docker', keywords: ['docker'] },
  { name: 'Kubernetes', keywords: ['kubernetes', 'k8s'] },
  { name: 'CI/CD', keywords: ['ci/cd', 'continuous integration', 'github actions', 'jenkins'] },
  { name: 'GraphQL', keywords: ['graphql'] },
  { name: 'REST APIs', keywords: ['rest', 'restful', 'rest api'] },
  { name: 'Microservices', keywords: ['microservice', 'microservices'] },
  { name: 'System Design', keywords: ['system design', 'distributed systems', 'scalability'] },
  { name: 'Testing', keywords: ['unit test', 'jest', 'playwright', 'pytest', 'integration test'] },
  { name: 'Git', keywords: ['git', 'github', 'gitlab'] },
  { name: 'Data Structures', keywords: ['data structures', 'algorithms'] },
  { name: 'Cloud', keywords: ['gcp', 'azure', 'cloud'] },
];

const SECTION_HEADINGS = ['experience', 'education', 'skills', 'projects'];

const ACTION_VERBS = [
  'led',
  'built',
  'designed',
  'developed',
  'implemented',
  'optimized',
  'architected',
  'launched',
  'shipped',
  'improved',
  'reduced',
  'increased',
  'created',
  'automated',
  'scaled',
  'migrated',
  'delivered',
  'owned',
];

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ ]/g, ' ')
    .replace(/\s+/g, ' ')} `;
}

function matchesKeyword(paddedText: string, keyword: string): boolean {
  if (/^[a-z0-9]+$/.test(keyword)) {
    return paddedText.includes(` ${keyword} `);
  }
  return paddedText.includes(keyword);
}

function countOccurrences(paddedText: string, terms: string[]): number {
  return terms.reduce((total, term) => (matchesKeyword(paddedText, term) ? total + 1 : total), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildStructureFeedback(
  wordCount: number,
  missingSections: string[],
  actionVerbCount: number,
  hasMetrics: boolean,
  hasEmail: boolean,
): ResumeFeedbackItem[] {
  const feedback: ResumeFeedbackItem[] = [];

  if (wordCount < 300) {
    feedback.push({
      title: 'Resume looks short',
      detail: `Around ${wordCount} words detected. Aim for 400–800 to give recruiters enough context.`,
      severity: 'critical',
    });
  } else if (wordCount > 1000) {
    feedback.push({
      title: 'Resume may be too long',
      detail: `Around ${wordCount} words detected. Tighten to one or two pages for senior ATS scans.`,
      severity: 'warning',
    });
  } else {
    feedback.push({
      title: 'Length is well balanced',
      detail: `Around ${wordCount} words — a good length for an engineering resume.`,
      severity: 'good',
    });
  }

  if (missingSections.length > 0) {
    feedback.push({
      title: 'Missing standard sections',
      detail: `Add clear headings for: ${missingSections.join(', ')}.`,
      severity: missingSections.length > 1 ? 'critical' : 'warning',
    });
  } else {
    feedback.push({
      title: 'All core sections present',
      detail: 'Experience, education, skills, and projects were all detected.',
      severity: 'good',
    });
  }

  const verbItem: ResumeFeedbackItem =
    actionVerbCount >= 4
      ? {
          title: 'Strong action verbs',
          detail: `Detected ${actionVerbCount} impact verbs such as led, built, and optimized.`,
          severity: 'good',
        }
      : {
          title: 'Use more action verbs',
          detail: 'Open bullet points with verbs like led, built, designed, or optimized.',
          severity: 'warning',
        };

  const metricsItem: ResumeFeedbackItem = hasMetrics
    ? {
        title: 'Quantified impact found',
        detail: 'Numbers and percentages help recruiters gauge your impact quickly.',
        severity: 'good',
      }
    : {
        title: 'Add measurable results',
        detail: 'Quantify achievements, e.g. "cut latency 40%" or "served 2M requests/day".',
        severity: 'critical',
      };

  feedback.push(verbItem, metricsItem);

  if (!hasEmail) {
    feedback.push({
      title: 'No email detected',
      detail: 'Make sure a professional email address is clearly visible at the top.',
      severity: 'critical',
    });
  }

  return feedback;
}

function buildActionableTips(
  missingSkills: string[],
  hasMetrics: boolean,
  actionVerbCount: number,
  missingSections: string[],
  hasPhone: boolean,
): string[] {
  const tips: string[] = [];
  if (missingSkills.length > 0) {
    tips.push(
      `Where truthful, surface in-demand skills you have experience with: ${missingSkills
        .slice(0, 5)
        .join(', ')}.`,
    );
  }
  if (!hasMetrics) {
    tips.push('Rewrite at least three bullets to include a concrete metric or outcome.');
  }
  if (actionVerbCount < 4) {
    tips.push('Lead every bullet with a strong past-tense action verb.');
  }
  if (missingSections.includes('projects')) {
    tips.push('Add a Projects section highlighting 2–3 technical builds with your role.');
  }
  if (!hasPhone) {
    tips.push('Add a reachable phone number alongside your email and links.');
  }
  tips.push('Mirror keywords from the target job description to lift ATS keyword matching.');
  return tips;
}

export function analyzeResumeText(text: string, _fileName: string): ResumeAnalysis {
  const padded = normalize(text);
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  const parsedSkills = SDE_SKILLS.filter((skill) =>
    skill.keywords.some((keyword) => matchesKeyword(padded, keyword)),
  ).map((skill) => skill.name);

  const missingSkills = SDE_SKILLS.filter((skill) => !parsedSkills.includes(skill.name))
    .map((skill) => skill.name)
    .slice(0, 8);

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(text);
  const foundSections = SECTION_HEADINGS.filter((section) => padded.includes(` ${section} `));
  const actionVerbCount = countOccurrences(padded, ACTION_VERBS);
  const hasMetrics = /(\d+%|\$\s?\d+|\b\d+\s?[xkm+])/i.test(text);

  const contactScore = (hasEmail ? 6 : 0) + (hasPhone ? 4 : 0);
  const sectionScore = foundSections.length * 5;
  const verbScore = clamp(actionVerbCount * 3, 0, 15);
  const metricsScore = hasMetrics ? 15 : 0;
  const skillScore = clamp(Math.round((parsedSkills.length / 12) * 30), 0, 30);
  let lengthScore: number;
  if (wordCount >= 400 && wordCount <= 1000) {
    lengthScore = 10;
  } else if (wordCount >= 250) {
    lengthScore = 6;
  } else {
    lengthScore = 2;
  }

  const atsScore = clamp(
    contactScore + sectionScore + verbScore + metricsScore + skillScore + lengthScore,
    0,
    100,
  );

  const missingSections = SECTION_HEADINGS.filter((section) => !foundSections.includes(section));

  const structureFeedback = buildStructureFeedback(
    wordCount,
    missingSections,
    actionVerbCount,
    hasMetrics,
    hasEmail,
  );

  const actionableTips = buildActionableTips(
    missingSkills,
    hasMetrics,
    actionVerbCount,
    missingSections,
    hasPhone,
  );

  let summary: string;
  if (atsScore >= 80) {
    summary = `Strong ATS alignment with ${parsedSkills.length} relevant skills detected.`;
  } else if (atsScore >= 60) {
    summary = `Solid foundation with ${parsedSkills.length} skills — a few targeted edits will push this higher.`;
  } else {
    summary = `Needs work: ${parsedSkills.length} skills matched. Focus on the critical items below.`;
  }

  return { atsScore, parsedSkills, missingSkills, structureFeedback, actionableTips, summary };
}

export interface ScoreBand {
  label: string;
  badgeVariant: BadgeVariant;
  fill: string;
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) {
    return { label: 'Excellent', badgeVariant: 'success', fill: 'var(--color-success)' };
  }
  if (score >= 60) {
    return { label: 'Good', badgeVariant: 'accent', fill: 'var(--color-accent)' };
  }
  if (score >= 40) {
    return { label: 'Needs work', badgeVariant: 'warning', fill: 'var(--color-warning)' };
  }
  return { label: 'Poor', badgeVariant: 'danger', fill: 'var(--color-danger)' };
}
