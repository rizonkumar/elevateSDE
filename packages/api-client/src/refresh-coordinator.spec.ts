import { AuthResponseDto } from '@elevatesde/shared-types';
import { createRefreshCoordinator } from './refresh-coordinator';

const session = (accessToken: string): AuthResponseDto => ({
  accessToken,
  refreshToken: `${accessToken}-refresh`,
  user: {
    id: 'user-1',
    email: 'candidate@example.com',
    tenantId: null,
    firstName: 'Ada',
    lastName: 'Lovelace',
    headline: null,
    role: 'USER',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
});

describe('createRefreshCoordinator', () => {
  it('shares one in-flight refresh between concurrent callers', async () => {
    const refresh = jest.fn(async () => session('access-2'));
    const coordinated = createRefreshCoordinator(refresh);

    const results = await Promise.all([coordinated('r1'), coordinated('r1'), coordinated('r1')]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.accessToken)).toEqual([
      'access-2',
      'access-2',
      'access-2',
    ]);
  });

  it('starts a new refresh once the previous one settles', async () => {
    const refresh = jest
      .fn()
      .mockResolvedValueOnce(session('access-2'))
      .mockResolvedValueOnce(session('access-3'));
    const coordinated = createRefreshCoordinator(refresh);

    await coordinated('r1');
    await expect(coordinated('r2')).resolves.toMatchObject({ accessToken: 'access-3' });
    expect(refresh).toHaveBeenNthCalledWith(2, 'r2');
  });

  it('shares a failure and allows a retry afterwards', async () => {
    const refresh = jest
      .fn()
      .mockRejectedValueOnce(new Error('expired'))
      .mockResolvedValueOnce(session('access-2'));
    const coordinated = createRefreshCoordinator(refresh);

    const outcomes = await Promise.allSettled([coordinated('r1'), coordinated('r1')]);

    expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true);
    await expect(coordinated('r1')).resolves.toMatchObject({ accessToken: 'access-2' });
  });
});
