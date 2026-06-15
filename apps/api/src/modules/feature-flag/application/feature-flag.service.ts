import { Injectable, NotFoundException } from '@nestjs/common';
import { IFeatureFlagRepository } from '../domain/interfaces/feature-flag-repository.interface';
import { FeatureFlag } from '../domain/entities/feature-flag';
import { randomUUID } from 'crypto';

@Injectable()
export class FeatureFlagService {
  constructor(private readonly featureFlagRepository: IFeatureFlagRepository) {}

  async create(flagKey: string, isEnabled = false, percentageRollout = 100): Promise<FeatureFlag> {
    const existing = await this.featureFlagRepository.findByKey(flagKey);
    if (existing) {
      throw new Error(`Feature flag with key ${flagKey} already exists`);
    }
    const id = randomUUID();
    const flag = FeatureFlag.create(id, flagKey, isEnabled, percentageRollout);
    return this.featureFlagRepository.save(flag);
  }

  async findById(id: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findById(id);
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }
    return flag;
  }

  async toggle(id: string, isEnabled: boolean): Promise<FeatureFlag> {
    const flag = await this.findById(id);
    const updated = flag.toggle(isEnabled);
    return this.featureFlagRepository.save(updated);
  }

  async updateRollout(id: string, percentageRollout: number): Promise<FeatureFlag> {
    const flag = await this.findById(id);
    const updated = flag.updateRollout(percentageRollout);
    return this.featureFlagRepository.save(updated);
  }

  async findByKey(flagKey: string): Promise<FeatureFlag | null> {
    return this.featureFlagRepository.findByKey(flagKey);
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.findAll();
  }

  async evaluate(flagKey: string, userId: string): Promise<boolean> {
    const flag = await this.featureFlagRepository.findByKey(flagKey);
    if (!flag || !flag.getIsEnabled()) {
      return false;
    }
    const rollout = flag.getPercentageRollout();
    if (rollout === 100) {
      return true;
    }
    if (rollout === 0) {
      return false;
    }
    const hash = this.hashCode(`${flagKey}:${userId}`);
    const bucket = hash % 100;
    return bucket < rollout;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
