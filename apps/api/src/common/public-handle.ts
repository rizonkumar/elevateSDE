import { ProfileVisibility } from '@prisma/client';

export interface PublicHandleSource {
  handle: string | null;
  profileVisibility: ProfileVisibility;
  tenant: { allowPublicProfiles: boolean } | null;
}

export const PUBLIC_HANDLE_SELECT = {
  handle: true,
  profileVisibility: true,
  tenant: { select: { allowPublicProfiles: true } },
} as const;

export function isProfilePublic(source: PublicHandleSource): boolean {
  return (
    source.handle !== null &&
    source.profileVisibility === ProfileVisibility.PUBLIC &&
    (source.tenant?.allowPublicProfiles ?? true)
  );
}

export function resolvePublicHandle(source: PublicHandleSource): string | null {
  return isProfilePublic(source) ? source.handle : null;
}
