import { ResumeFeedbackItem } from '@elevatesde/shared-types';
import { ResumeScoreResult } from '../interfaces/resume-analyzer.interface';
import { ACTION_VERBS, SDE_SKILLS, SECTION_HEADINGS } from './skill-catalog';

const MIN_READABLE_LENGTH = 40;
const MAX_MISSING_SKILLS = 8;
const MAX_SUGGESTED_SKILLS = 5;
const SHORT_RESUME_WORDS = 300;
const LONG_RESUME_WORDS = 1000;
const WELL_SIZED_MIN_WORDS = 400;
const WELL_SIZED_MAX_WORDS = 1000;
const ACCEPTABLE_MIN_WORDS = 250;
const MIN_STRONG_ACTION_VERBS = 4;
const CONTACT_EMAIL_POINTS = 6;
const CONTACT_PHONE_POINTS = 4;
const SECTION_POINTS_EACH = 5;
const VERB_POINTS_PER_MATCH = 3;
const MAX_VERB_SCORE = 15;
const METRICS_SCORE = 15;
const MAX_SKILL_SCORE = 30;
const SKILL_SCORE_DENOMINATOR = 12;
const WELL_SIZED_LENGTH_SCORE = 10;
const ACCEPTABLE_LENGTH_SCORE = 6;
const SHORT_LENGTH_SCORE = 2;
const MAX_SCORE = 100;
const MIN_SCORE = 0;
const STRONG_SCORE_THRESHOLD = 80;
const SOLID_SCORE_THRESHOLD = 60;

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/;
const METRICS_PATTERN = /(\d+%|\$\s?\d+|\b\d+\s?[xkm+])/i;
const ALPHANUMERIC_KEYWORD_PATTERN = /^[a-z0-9]+$/;

export function isReadableResumeText(text: string): boolean {
  return text.trim().length >= MIN_READABLE_LENGTH;
}

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ ]/g, ' ')
    .replace(/\s+/g, ' ')} `;
}

function matchesKeyword(paddedText: string, keyword: string): boolean {
  if (ALPHANUMERIC_KEYWORD_PATTERN.test(keyword)) {
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

  if (wordCount < SHORT_RESUME_WORDS) {
    feedback.push({
      title: 'Resume looks short',
      detail: `Around ${wordCount} words detected. Aim for 400–800 to give recruiters enough context.`,
      severity: 'critical',
    });
  } else if (wordCount > LONG_RESUME_WORDS) {
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
    actionVerbCount >= MIN_STRONG_ACTION_VERBS
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
        .slice(0, MAX_SUGGESTED_SKILLS)
        .join(', ')}.`,
    );
  }
  if (!hasMetrics) {
    tips.push('Rewrite at least three bullets to include a concrete metric or outcome.');
  }
  if (actionVerbCount < MIN_STRONG_ACTION_VERBS) {
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

export function scoreResumeText(text: string): ResumeScoreResult {
  const padded = normalize(text);
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  const parsedSkills = SDE_SKILLS.filter((skill) =>
    skill.keywords.some((keyword) => matchesKeyword(padded, keyword)),
  ).map((skill) => skill.name);

  const missingSkills = SDE_SKILLS.filter((skill) => !parsedSkills.includes(skill.name))
    .map((skill) => skill.name)
    .slice(0, MAX_MISSING_SKILLS);

  const hasEmail = EMAIL_PATTERN.test(text);
  const hasPhone = PHONE_PATTERN.test(text);
  const foundSections = SECTION_HEADINGS.filter((section) => padded.includes(` ${section} `));
  const actionVerbCount = countOccurrences(padded, ACTION_VERBS);
  const hasMetrics = METRICS_PATTERN.test(text);

  const contactScore =
    (hasEmail ? CONTACT_EMAIL_POINTS : 0) + (hasPhone ? CONTACT_PHONE_POINTS : 0);
  const sectionScore = foundSections.length * SECTION_POINTS_EACH;
  const verbScore = clamp(actionVerbCount * VERB_POINTS_PER_MATCH, 0, MAX_VERB_SCORE);
  const metricsScore = hasMetrics ? METRICS_SCORE : 0;
  const skillScore = clamp(
    Math.round((parsedSkills.length / SKILL_SCORE_DENOMINATOR) * MAX_SKILL_SCORE),
    0,
    MAX_SKILL_SCORE,
  );
  let lengthScore: number;
  if (wordCount >= WELL_SIZED_MIN_WORDS && wordCount <= WELL_SIZED_MAX_WORDS) {
    lengthScore = WELL_SIZED_LENGTH_SCORE;
  } else if (wordCount >= ACCEPTABLE_MIN_WORDS) {
    lengthScore = ACCEPTABLE_LENGTH_SCORE;
  } else {
    lengthScore = SHORT_LENGTH_SCORE;
  }

  const atsScore = clamp(
    contactScore + sectionScore + verbScore + metricsScore + skillScore + lengthScore,
    MIN_SCORE,
    MAX_SCORE,
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
  if (atsScore >= STRONG_SCORE_THRESHOLD) {
    summary = `Strong ATS alignment with ${parsedSkills.length} relevant skills detected.`;
  } else if (atsScore >= SOLID_SCORE_THRESHOLD) {
    summary = `Solid foundation with ${parsedSkills.length} skills — a few targeted edits will push this higher.`;
  } else {
    summary = `Needs work: ${parsedSkills.length} skills matched. Focus on the critical items below.`;
  }

  return { atsScore, parsedSkills, missingSkills, structureFeedback, actionableTips, summary };
}
