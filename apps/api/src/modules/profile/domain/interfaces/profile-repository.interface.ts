import { PublicProfileView } from '../read-models/public-profile-view';

export abstract class IProfileRepository {
  abstract findPublicProfile(handle: string): Promise<PublicProfileView | null>;
}
