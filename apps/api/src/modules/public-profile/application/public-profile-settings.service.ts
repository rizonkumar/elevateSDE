import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileVisibility } from '@prisma/client';
import { HandleUnavailableReason } from '@elevatesde/shared-types';
import { isProfilePublic } from '../../../common/public-handle';
import { HandleTakenError } from '../domain/errors/handle-taken.error';
import { IPublicProfileRepository } from '../domain/interfaces/public-profile-repository.interface';
import {
  describeHandleProblem,
  handleFormatProblem,
  normalizeHandle,
} from '../domain/policies/handle-policy';
import { ProfileLinkKind, normalizeProfileLink } from '../domain/policies/profile-link-policy';
import { BIO_MAX_LENGTH, LOCATION_MAX_LENGTH } from '../domain/policies/profile-text-limits';
import {
  PublicProfileSettingsRecord,
  PublicProfileSettingsView,
  PublicProfileSettingsWrite,
} from '../domain/read-models/public-profile';

export interface PublicProfileSettingsPatch {
  handle?: string | null;
  bio?: string | null;
  location?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  profileVisibility?: ProfileVisibility;
  showOrganization?: boolean;
}

export interface HandleAvailabilityView {
  handle: string;
  available: boolean;
  reason: HandleUnavailableReason | null;
}

@Injectable()
export class PublicProfileSettingsService {
  constructor(private readonly repository: IPublicProfileRepository) {}

  async getSettings(userId: string): Promise<PublicProfileSettingsView> {
    return toView(await this.requireSettings(userId));
  }

  async checkAvailability(userId: string, rawHandle: string): Promise<HandleAvailabilityView> {
    const handle = normalizeHandle(rawHandle);
    const problem = handleFormatProblem(handle);
    if (problem) {
      return { handle, available: false, reason: problem };
    }
    const ownerId = await this.repository.findUserIdByHandle(handle);
    if (ownerId !== null && ownerId !== userId) {
      return { handle, available: false, reason: 'TAKEN' };
    }
    return { handle, available: true, reason: null };
  }

  async update(
    userId: string,
    patch: PublicProfileSettingsPatch,
  ): Promise<PublicProfileSettingsView> {
    const current = await this.requireSettings(userId);
    const handle =
      patch.handle === undefined ? current.handle : await this.resolveHandle(userId, patch.handle);
    const next: PublicProfileSettingsWrite = {
      handle,
      bio: patch.bio === undefined ? current.bio : boundedText(patch.bio, BIO_MAX_LENGTH, 'Bio'),
      location:
        patch.location === undefined
          ? current.location
          : boundedText(patch.location, LOCATION_MAX_LENGTH, 'Location'),
      githubUrl:
        patch.githubUrl === undefined ? current.githubUrl : linkOrThrow('github', patch.githubUrl),
      linkedinUrl:
        patch.linkedinUrl === undefined
          ? current.linkedinUrl
          : linkOrThrow('linkedin', patch.linkedinUrl),
      websiteUrl:
        patch.websiteUrl === undefined
          ? current.websiteUrl
          : linkOrThrow('website', patch.websiteUrl),
      profileVisibility: patch.profileVisibility ?? current.profileVisibility,
      showOrganization: patch.showOrganization ?? current.showOrganization,
    };
    if (next.profileVisibility === ProfileVisibility.PUBLIC && next.handle === null) {
      throw new BadRequestException('Claim a handle before making your profile public.');
    }
    try {
      await this.repository.saveSettings(userId, next);
    } catch (error) {
      if (error instanceof HandleTakenError) {
        throw new ConflictException(describeHandleProblem('TAKEN'));
      }
      throw error;
    }
    return toView({ ...next, organization: current.organization });
  }

  private async resolveHandle(userId: string, raw: string | null): Promise<string | null> {
    if (raw === null || raw.trim().length === 0) {
      return null;
    }
    const availability = await this.checkAvailability(userId, raw);
    if (availability.reason === 'TAKEN') {
      throw new ConflictException(describeHandleProblem('TAKEN'));
    }
    if (availability.reason) {
      throw new BadRequestException(describeHandleProblem(availability.reason));
    }
    return availability.handle;
  }

  private async requireSettings(userId: string): Promise<PublicProfileSettingsRecord> {
    const settings = await this.repository.findSettings(userId);
    if (!settings) {
      throw new NotFoundException('User not found.');
    }
    return settings;
  }
}

function toView(record: PublicProfileSettingsRecord): PublicProfileSettingsView {
  return {
    ...record,
    isPublic: isProfilePublic({
      handle: record.handle,
      profileVisibility: record.profileVisibility,
      tenant: record.organization,
    }),
  };
}

function boundedText(raw: string | null, maxLength: number, label: string): string | null {
  const trimmed = raw?.trim() ?? '';
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new BadRequestException(`${label} must be at most ${maxLength} characters.`);
  }
  return trimmed;
}

function linkOrThrow(kind: ProfileLinkKind, raw: string | null): string | null {
  const result = normalizeProfileLink(kind, raw);
  if (!result.ok) {
    throw new BadRequestException(result.message);
  }
  return result.value;
}
