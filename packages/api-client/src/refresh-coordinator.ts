import { AuthResponseDto } from '@elevatesde/shared-types';

export type RefreshSession = (refreshToken: string) => Promise<AuthResponseDto>;

export function createRefreshCoordinator(refresh: RefreshSession): RefreshSession {
  let inFlight: Promise<AuthResponseDto> | null = null;
  return (refreshToken) => {
    inFlight ??= refresh(refreshToken).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
