import type { RealtimeRoomKind } from '@elevatesde/shared-types';

export interface RealtimeViewer {
  userId: string;
  tenantId: string | null;
}

export interface RoomAuthorizer {
  readonly kind: RealtimeRoomKind;
  canJoin(viewer: RealtimeViewer, resourceId: string): Promise<boolean>;
}
