export type ProfileLinkKind = 'github' | 'linkedin' | 'website';

export const PROFILE_LINK_MAX_LENGTH = 200;

const ALLOWED_HOSTS: Record<Exclude<ProfileLinkKind, 'website'>, string> = {
  github: 'github.com',
  linkedin: 'linkedin.com',
};

const LINK_LABELS: Record<ProfileLinkKind, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  website: 'Website',
};

export type ProfileLinkResult = { ok: true; value: string | null } | { ok: false; message: string };

function matchesHost(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function normalizeProfileLink(kind: ProfileLinkKind, raw: string | null): ProfileLinkResult {
  const trimmed = raw?.trim() ?? '';
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  const label = LINK_LABELS[kind];
  if (trimmed.length > PROFILE_LINK_MAX_LENGTH) {
    return {
      ok: false,
      message: `${label} link must be at most ${PROFILE_LINK_MAX_LENGTH} characters.`,
    };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, message: `${label} link must be a valid URL.` };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, message: `${label} link must start with https://.` };
  }
  if (url.username || url.password) {
    return { ok: false, message: `${label} link cannot contain credentials.` };
  }
  const hostname = url.hostname.toLowerCase();
  if (kind !== 'website' && !matchesHost(hostname, ALLOWED_HOSTS[kind])) {
    return { ok: false, message: `${label} link must point to ${ALLOWED_HOSTS[kind]}.` };
  }
  if (kind === 'website' && !hostname.includes('.')) {
    return { ok: false, message: `${label} link must use a public domain.` };
  }
  return { ok: true, value: url.toString() };
}
