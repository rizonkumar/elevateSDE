import { StudyGroupJoinPolicy } from '@prisma/client';
import { STUDY_GROUP_LIMITS } from '@elevatesde/shared-types';
import { GoalWriteInput, GroupWriteInput } from '../read-models/study-group-records';

export type RuleResult<T> = { ok: true; value: T } | { ok: false; message: string };

export interface GroupDraft {
  name: string;
  description?: string | null;
  joinPolicy: StudyGroupJoinPolicy;
}

export function normalizeGroupDraft(draft: GroupDraft): RuleResult<GroupWriteInput> {
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (name.length === 0) {
    return { ok: false, message: 'Group name is required.' };
  }
  if (name.length > STUDY_GROUP_LIMITS.nameMaxLength) {
    return {
      ok: false,
      message: `Group name must be at most ${STUDY_GROUP_LIMITS.nameMaxLength} characters.`,
    };
  }
  const description = draft.description?.trim() ?? '';
  if (description.length > STUDY_GROUP_LIMITS.descriptionMaxLength) {
    return {
      ok: false,
      message: `Description must be at most ${STUDY_GROUP_LIMITS.descriptionMaxLength} characters.`,
    };
  }
  return {
    ok: true,
    value: {
      name,
      description: description.length > 0 ? description : null,
      joinPolicy: draft.joinPolicy,
    },
  };
}

export function normalizeGoalDraft(draft: GoalWriteInput): RuleResult<GoalWriteInput> {
  const title = draft.title.trim().replace(/\s+/g, ' ');
  if (title.length === 0) {
    return { ok: false, message: 'Goal title is required.' };
  }
  if (title.length > STUDY_GROUP_LIMITS.goalTitleMaxLength) {
    return {
      ok: false,
      message: `Goal title must be at most ${STUDY_GROUP_LIMITS.goalTitleMaxLength} characters.`,
    };
  }
  if (!Number.isInteger(draft.target) || draft.target < 1) {
    return { ok: false, message: 'Target must be a whole number of at least 1.' };
  }
  if (draft.target > STUDY_GROUP_LIMITS.goalTargetMax) {
    return {
      ok: false,
      message: `Target must be at most ${STUDY_GROUP_LIMITS.goalTargetMax}.`,
    };
  }
  if (Number.isNaN(draft.startsAt.getTime()) || Number.isNaN(draft.endsAt.getTime())) {
    return { ok: false, message: 'Start and end dates must be valid dates.' };
  }
  if (draft.endsAt.getTime() <= draft.startsAt.getTime()) {
    return { ok: false, message: 'The goal must end after it starts.' };
  }
  return { ok: true, value: { ...draft, title } };
}

export function exceedsMemberLimit(currentCount: number, additions: number): boolean {
  return currentCount + additions > STUDY_GROUP_LIMITS.maxMembers;
}

export function exceedsGoalLimit(openGoalCount: number): boolean {
  return openGoalCount >= STUDY_GROUP_LIMITS.maxActiveGoals;
}
