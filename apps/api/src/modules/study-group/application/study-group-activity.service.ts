import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StudyGoalScope } from '@prisma/client';
import { PointsAwardedEvent } from '../../leaderboard/domain/events/points-events';
import {
  NOTIFICATION_EVENTS,
  StudyGoalCompletedEvent,
} from '../../notification/domain/events/notification-events';
import { IStudyGroupRepository } from '../domain/interfaces/study-group-repository.interface';
import { goalWindow, metricsAffectedBy } from '../domain/goal-progress';
import { OpenGoalRecord } from '../domain/read-models/study-group-records';
import { StudyGroupActivityView } from '../domain/read-models/study-group-views';
import { toActivityView } from './study-group.service';

export interface RecordedGroupActivity {
  groupIds: string[];
  activity: StudyGroupActivityView | null;
}

const NOTHING_RECORDED: RecordedGroupActivity = { groupIds: [], activity: null };

@Injectable()
export class StudyGroupActivityService {
  constructor(
    private readonly repository: IStudyGroupRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recordAward(
    event: PointsAwardedEvent,
    now: Date = new Date(),
  ): Promise<RecordedGroupActivity> {
    const affectedMetrics = metricsAffectedBy(event.source);
    if (affectedMetrics.length === 0) {
      return NOTHING_RECORDED;
    }
    const memberships = await this.repository.listActiveMembershipsForUser(event.userId);
    const tenantId = memberships[0]?.tenantId;
    if (!tenantId) {
      return NOTHING_RECORDED;
    }
    const groupIds = memberships.map((membership) => membership.groupId);
    const [record] = await this.repository.describeActivity([
      {
        userId: event.userId,
        source: event.source,
        refId: event.refId,
        delta: event.delta,
        createdAt: event.awardedAt,
      },
    ]);
    const goals = (await this.repository.listInProgressGoals(groupIds, now)).filter((goal) =>
      affectedMetrics.includes(goal.metric),
    );
    if (goals.length > 0) {
      const membersByGroup = await this.repository.listMemberIdsByGroup(
        [...new Set(goals.map((goal) => goal.groupId))],
        tenantId,
      );
      for (const goal of goals) {
        await this.evaluateGoal(goal, membersByGroup.get(goal.groupId) ?? [], event.userId, now);
      }
    }
    return { groupIds, activity: record ? toActivityView(record) : null };
  }

  private async evaluateGoal(
    goal: OpenGoalRecord,
    memberIds: string[],
    earnerId: string,
    now: Date,
  ): Promise<void> {
    if (memberIds.length === 0) {
      return;
    }
    const totals = await this.repository.metricTotals(memberIds, goal.metric, goalWindow(goal));
    const valueOf = (userId: string) => totals.get(userId) ?? 0;
    if (goal.scope === StudyGoalScope.GROUP_TOTAL) {
      const current = memberIds.reduce((sum, userId) => sum + valueOf(userId), 0);
      if (current < goal.target || !(await this.repository.markGoalCompleted(goal.id, now))) {
        return;
      }
      memberIds.forEach((recipientId) => this.announce(goal, recipientId, false));
      return;
    }
    if (valueOf(earnerId) >= goal.target) {
      this.announce(goal, earnerId, true);
    }
    if (memberIds.every((userId) => valueOf(userId) >= goal.target)) {
      await this.repository.markGoalCompleted(goal.id, now);
    }
  }

  private announce(goal: OpenGoalRecord, recipientId: string, personal: boolean): void {
    const event: StudyGoalCompletedEvent = {
      recipientId,
      groupId: goal.groupId,
      groupName: goal.groupName,
      goalTitle: goal.title,
      personal,
      dedupeKey: `goal:${goal.id}:${recipientId}`,
    };
    this.eventEmitter.emit(NOTIFICATION_EVENTS.STUDY_GOAL_COMPLETED, event);
  }
}
