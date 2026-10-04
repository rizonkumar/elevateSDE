export interface UserStatsState {
  badges: string[];
}

export class UserStats {
  private constructor(
    private readonly userId: string,
    private readonly badges: string[],
  ) {}

  static reconstitute(userId: string, state: UserStatsState): UserStats {
    return new UserStats(userId, state.badges);
  }

  withBadges(badges: string[]): UserStats {
    return new UserStats(this.userId, normalizeBadges(badges));
  }

  getUserId(): string {
    return this.userId;
  }

  getBadges(): string[] {
    return this.badges;
  }
}

function normalizeBadges(badges: string[]): string[] {
  return Array.from(
    new Set(badges.map((badge) => badge.trim()).filter((badge) => badge.length > 0)),
  );
}
