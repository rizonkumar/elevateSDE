export class FeatureFlag {
  private constructor(
    private readonly id: string,
    private readonly flagKey: string,
    private readonly isEnabled: boolean,
    private readonly percentageRollout: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    flagKey: string,
    isEnabled: boolean = false,
    percentageRollout: number = 100,
  ): FeatureFlag {
    if (!flagKey) {
      throw new Error('Flag key cannot be empty');
    }
    if (percentageRollout < 0 || percentageRollout > 100) {
      throw new Error('Percentage rollout must be between 0 and 100');
    }
    const now = new Date();
    return new FeatureFlag(id, flagKey, isEnabled, percentageRollout, now, now);
  }

  static reconstitute(
    id: string,
    flagKey: string,
    isEnabled: boolean,
    percentageRollout: number,
    createdAt: Date,
    updatedAt: Date,
  ): FeatureFlag {
    return new FeatureFlag(id, flagKey, isEnabled, percentageRollout, createdAt, updatedAt);
  }

  toggle(isEnabled: boolean): FeatureFlag {
    return new FeatureFlag(
      this.id,
      this.flagKey,
      isEnabled,
      this.percentageRollout,
      this.createdAt,
      new Date(),
    );
  }

  updateRollout(percentageRollout: number): FeatureFlag {
    if (percentageRollout < 0 || percentageRollout > 100) {
      throw new Error('Percentage rollout must be between 0 and 100');
    }
    return new FeatureFlag(
      this.id,
      this.flagKey,
      this.isEnabled,
      percentageRollout,
      this.createdAt,
      new Date(),
    );
  }

  getId(): string {
    return this.id;
  }

  getFlagKey(): string {
    return this.flagKey;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  getPercentageRollout(): number {
    return this.percentageRollout;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
