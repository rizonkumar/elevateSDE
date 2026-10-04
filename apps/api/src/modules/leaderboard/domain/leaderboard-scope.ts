export type LeaderboardScope = { kind: 'tenant'; tenantId: string | null } | { kind: 'platform' };

export interface LeaderboardViewer {
  getId(): string;
  getTenantId(): string | null;
}

export const PLATFORM_SCOPE: LeaderboardScope = { kind: 'platform' };

export function scopeForViewer(viewer: LeaderboardViewer): LeaderboardScope {
  return { kind: 'tenant', tenantId: viewer.getTenantId() };
}
