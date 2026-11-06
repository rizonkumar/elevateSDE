import { RealtimeViewer } from './room-authorizer';

export interface RealtimeIdentity extends RealtimeViewer {
  expiresAt: number;
}

export const REALTIME_AUTH_ERRORS = {
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
} as const;

export type RealtimeAuthErrorCode = (typeof REALTIME_AUTH_ERRORS)[keyof typeof REALTIME_AUTH_ERRORS];

export class RealtimeAuthError extends Error {
  constructor(readonly code: RealtimeAuthErrorCode) {
    super(code);
  }
}
