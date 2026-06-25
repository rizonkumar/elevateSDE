import { DAY_MS, startOfUtcDay } from '../daily-date';

export interface StreakStateProps {
  streakDays: number;
  longestStreak: number;
  lastActiveDate: Date | null;
}

export class StreakState {
  private constructor(private readonly props: StreakStateProps) {}

  static create(props: StreakStateProps): StreakState {
    return new StreakState({
      streakDays: clampNonNegative(props.streakDays),
      longestStreak: clampNonNegative(props.longestStreak),
      lastActiveDate: props.lastActiveDate,
    });
  }

  registerActivity(activityDate: Date): StreakState {
    const active = startOfUtcDay(activityDate);
    const last = this.props.lastActiveDate ? startOfUtcDay(this.props.lastActiveDate) : null;

    if (last && last.getTime() === active.getTime()) {
      return this;
    }

    const continues = last !== null && active.getTime() - last.getTime() === DAY_MS;
    const streakDays = continues ? this.props.streakDays + 1 : 1;
    const longestStreak = Math.max(this.props.longestStreak, streakDays);

    return StreakState.create({ streakDays, longestStreak, lastActiveDate: active });
  }

  getStreakDays(): number {
    return this.props.streakDays;
  }

  getLongestStreak(): number {
    return this.props.longestStreak;
  }

  getLastActiveDate(): Date | null {
    return this.props.lastActiveDate;
  }
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}
