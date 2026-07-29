import { Injectable, NotFoundException } from '@nestjs/common';
import { IProfileRepository } from '../domain/interfaces/profile-repository.interface';
import { PublicProfileView } from '../domain/read-models/public-profile-view';

@Injectable()
export class ProfileService {
  constructor(private readonly repository: IProfileRepository) {}

  async getPublicProfile(handle: string): Promise<PublicProfileView> {
    const profile = await this.repository.findPublicProfile(handle);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }
}
