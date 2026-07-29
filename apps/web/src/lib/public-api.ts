import type { PublicCollectionDetailDto, PublicProfileDto } from '@elevatesde/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400';
const REVALIDATE_SECONDS = 300;

export async function getPublicProfile(handle: string): Promise<PublicProfileDto | null> {
  const response = await fetch(`${BASE_URL}/api/v1/public/profiles/${encodeURIComponent(handle)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as PublicProfileDto;
}

export async function getPublicCollection(id: string): Promise<PublicCollectionDetailDto | null> {
  const response = await fetch(`${BASE_URL}/api/v1/public/lists/${encodeURIComponent(id)}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as PublicCollectionDetailDto;
}
