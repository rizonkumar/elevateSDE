import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProfileVisibility } from '@prisma/client';
import {
  FakePublicProfileRepository,
  profileUser,
} from '../testing/fake-public-profile.repository';
import { PublicProfileSettingsService } from './public-profile-settings.service';

describe('PublicProfileSettingsService', () => {
  let repository: FakePublicProfileRepository;
  let service: PublicProfileSettingsService;

  beforeEach(() => {
    repository = new FakePublicProfileRepository();
    repository.users = [profileUser('user-1'), profileUser('user-2', { handle: 'taken-one' })];
    service = new PublicProfileSettingsService(repository);
  });

  describe('checkAvailability', () => {
    it('reports a free handle as available after normalizing it', async () => {
      await expect(service.checkAvailability('user-1', ' Ada-Dev ')).resolves.toEqual({
        handle: 'ada-dev',
        available: true,
        reason: null,
      });
    });

    it('reports handles owned by someone else as taken', async () => {
      await expect(service.checkAvailability('user-1', 'taken-one')).resolves.toMatchObject({
        available: false,
        reason: 'TAKEN',
      });
    });

    it('treats the caller own handle as available', async () => {
      await expect(service.checkAvailability('user-2', 'taken-one')).resolves.toMatchObject({
        available: true,
      });
    });

    it('reports reserved and invalid handles', async () => {
      await expect(service.checkAvailability('user-1', 'admin')).resolves.toMatchObject({
        reason: 'RESERVED',
      });
      await expect(service.checkAvailability('user-1', 'a_b')).resolves.toMatchObject({
        reason: 'INVALID',
      });
    });
  });

  describe('update', () => {
    it('claims a handle, trims text and normalizes links', async () => {
      const view = await service.update('user-1', {
        handle: 'Ada-Dev',
        bio: '  Building things.  ',
        location: ' Berlin ',
        githubUrl: 'https://github.com/ada',
        profileVisibility: ProfileVisibility.PUBLIC,
      });
      expect(view).toMatchObject({
        handle: 'ada-dev',
        bio: 'Building things.',
        location: 'Berlin',
        githubUrl: 'https://github.com/ada',
        profileVisibility: ProfileVisibility.PUBLIC,
        isPublic: true,
      });
      expect(repository.saved).toHaveLength(1);
    });

    it('keeps fields that are not part of the patch', async () => {
      repository.users = [
        profileUser('user-1', {
          handle: 'ada',
          bio: 'Existing bio',
          websiteUrl: 'https://ada.dev/',
        }),
      ];
      const view = await service.update('user-1', { showOrganization: true });
      expect(view).toMatchObject({
        handle: 'ada',
        bio: 'Existing bio',
        websiteUrl: 'https://ada.dev/',
        showOrganization: true,
      });
    });

    it('requires a handle before going public', async () => {
      await expect(
        service.update('user-1', { profileVisibility: ProfileVisibility.PUBLIC }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects clearing the handle of a public profile', async () => {
      repository.users = [
        profileUser('user-1', { handle: 'ada', profileVisibility: ProfileVisibility.PUBLIC }),
      ];
      await expect(service.update('user-1', { handle: null })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects non-https links and links on the wrong domain', async () => {
      await expect(
        service.update('user-1', { websiteUrl: 'http://ada.dev' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.update('user-1', { githubUrl: 'https://gitlab.com/ada' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.update('user-1', { linkedinUrl: 'https://example.com/in/ada' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects reserved and invalid handles with 400', async () => {
      await expect(service.update('user-1', { handle: 'admin' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.update('user-1', { handle: '-bad' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns 409 when the handle belongs to someone else', async () => {
      await expect(service.update('user-1', { handle: 'taken-one' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('returns 409 when a concurrent claim wins the unique index', async () => {
      repository.raceHandle = 'racy';
      await expect(service.update('user-1', { handle: 'racy' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects an overly long bio', async () => {
      await expect(service.update('user-1', { bio: 'x'.repeat(281) })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('reports a public profile as not public when the organization disallows it', async () => {
      repository.users = [
        profileUser('user-1', {
          handle: 'ada',
          organization: { name: 'Acme', allowPublicProfiles: false },
        }),
      ];
      const view = await service.update('user-1', { profileVisibility: ProfileVisibility.PUBLIC });
      expect(view.isPublic).toBe(false);
    });

    it('returns 404 for unknown users', async () => {
      await expect(service.getSettings('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
