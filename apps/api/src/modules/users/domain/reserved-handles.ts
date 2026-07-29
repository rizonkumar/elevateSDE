export const RESERVED_HANDLES = new Set([
  'about',
  'admin',
  'api',
  'dashboard',
  'invite',
  'login',
  'me',
  'privacy',
  'register',
  'settings',
  'support',
  'terms',
  'u',
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle);
}
