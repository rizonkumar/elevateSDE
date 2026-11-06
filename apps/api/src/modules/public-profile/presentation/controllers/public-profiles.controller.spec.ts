import { NotFoundException } from '@nestjs/common';
import { ProfileVisibility } from '@prisma/client';
import type { Response } from 'express';
import { PublicProfileService } from '../../application/public-profile.service';
import {
  FakeHeatmapSource,
  FakePublicProfileRepository,
  FakeRatingSource,
  profileUser,
} from '../../testing/fake-public-profile.repository';
import { PublicProfilesController } from './public-profiles.controller';

function recordingResponse(): { response: Response; headers: string[] } {
  const headers: string[] = [];
  const response = {
    setHeader: (name: string, value: string) => {
      if (name === 'Cache-Control') {
        headers.push(value);
      }
    },
  } as unknown as Response;
  return { response, headers };
}

describe('PublicProfilesController caching', () => {
  let repository: FakePublicProfileRepository;
  let controller: PublicProfilesController;

  beforeEach(() => {
    repository = new FakePublicProfileRepository();
    controller = new PublicProfilesController(
      new PublicProfileService(repository, new FakeHeatmapSource(), new FakeRatingSource()),
    );
  });

  it('marks a successful response as publicly cacheable for 60 seconds', async () => {
    repository.users.push(
      profileUser('user-1', { handle: 'ada', profileVisibility: ProfileVisibility.PUBLIC }),
    );
    const { response, headers } = recordingResponse();

    await controller.getByHandle('ada', response);

    expect(headers[headers.length - 1]).toBe('public, max-age=60');
  });

  it('never leaves a cacheable header on a 404', async () => {
    const { response, headers } = recordingResponse();

    await expect(controller.getByHandle('ghost', response)).rejects.toThrow(NotFoundException);

    expect(headers).toEqual(['no-store']);
  });
});
