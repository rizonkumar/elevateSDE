import { HandleUnavailableReason } from '@elevatesde/shared-types';

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  'about',
  'account',
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'billing',
  'blog',
  'contest',
  'contests',
  'dashboard',
  'docs',
  'elevatesde',
  'explore',
  'help',
  'invite',
  'login',
  'logout',
  'me',
  'moderator',
  'null',
  'official',
  'org',
  'profile',
  'public',
  'register',
  'root',
  'security',
  'settings',
  'signin',
  'signup',
  'staff',
  'status',
  'support',
  'system',
  'team',
  'u',
  'undefined',
  'user',
  'users',
  'www',
]);

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

export function handleFormatProblem(handle: string): HandleUnavailableReason | null {
  if (!HANDLE_PATTERN.test(handle) || handle.includes('--')) {
    return 'INVALID';
  }
  if (RESERVED_HANDLES.has(handle)) {
    return 'RESERVED';
  }
  return null;
}

export function describeHandleProblem(reason: HandleUnavailableReason): string {
  if (reason === 'RESERVED') {
    return 'This handle is reserved. Please choose another one.';
  }
  if (reason === 'TAKEN') {
    return 'This handle is already taken.';
  }
  return `Handles are ${HANDLE_MIN_LENGTH} to ${HANDLE_MAX_LENGTH} characters of lowercase letters, numbers and single hyphens, and cannot start or end with a hyphen.`;
}
