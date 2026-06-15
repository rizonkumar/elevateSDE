import { FeatureFlag } from '../entities/feature-flag';

export abstract class IFeatureFlagRepository {
  abstract findById(id: string): Promise<FeatureFlag | null>;
  abstract findByKey(flagKey: string): Promise<FeatureFlag | null>;
  abstract save(featureFlag: FeatureFlag): Promise<FeatureFlag>;
  abstract findAll(): Promise<FeatureFlag[]>;
}
