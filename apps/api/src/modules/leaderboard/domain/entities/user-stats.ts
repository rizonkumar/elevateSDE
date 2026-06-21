export interface UserStatsState {
  points: number;
  monthlyPoints: number;
  weeklyPoints: number;
  assessmentsCompleted: number;
  badges: string[];
  streakDays: number;
}

export class UserStats {
  private constructor(
    private readonly userId: string,
    private readonly points: number,
    private readonly monthlyPoints: number,
    private readonly weeklyPoints: number,
    private readonly assessmentsCompleted: number,
    private readonly badges: string[],
    private readonly streakDays: number,
  ) {}

  static create(userId: string, state: UserStatsState): UserStats {
    return new UserStats(
      userId,
      clampNonNegative(state.points),
      clampNonNegative(state.monthlyPoints),
      clampNonNegative(state.weeklyPoints),
      clampNonNegative(state.assessmentsCompleted),
      normalizeBadges(state.badges),
      clampNonNegative(state.streakDays),
    );
  }

  static reconstitute(userId: string, state: UserStatsState): UserStats {
    return new UserStats(
      userId,
      state.points,
      state.monthlyPoints,
      state.weeklyPoints,
      state.assessmentsCompleted,
      state.badges,
      state.streakDays,
    );
  }

  adjust(points: number, badges: string[]): UserStats {
    return new UserStats(
      this.userId,
      clampNonNegative(points),
      this.monthlyPoints,
      this.weeklyPoints,
      this.assessmentsCompleted,
      normalizeBadges(badges),
      this.streakDays,
    );
  }

  getUserId(): string {
    return this.userId;
  }

  getPoints(): number {
    return this.points;
  }

  getMonthlyPoints(): number {
    return this.monthlyPoints;
  }

  getWeeklyPoints(): number {
    return this.weeklyPoints;
  }

  getAssessmentsCompleted(): number {
    return this.assessmentsCompleted;
  }

  getBadges(): string[] {
    return this.badges;
  }

  getStreakDays(): number {
    return this.streakDays;
  }
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function normalizeBadges(badges: string[]): string[] {
  return Array.from(new Set(badges.map((badge) => badge.trim()).filter((badge) => badge.length > 0)));
}
