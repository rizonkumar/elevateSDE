import type { PublicProfileDto } from '@elevatesde/shared-types';

const PROFILE_REVALIDATE_SECONDS = 60;

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400';
}

export async function fetchPublicProfile(handle: string): Promise<PublicProfileDto | null> {
  const url = `${apiBaseUrl()}/api/v1/public/profiles/${encodeURIComponent(handle)}`;
  try {
    const response = await fetch(url, { next: { revalidate: PROFILE_REVALIDATE_SECONDS } });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicProfileDto;
  } catch {
    return null;
  }
}
