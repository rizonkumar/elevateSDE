import { UserRole } from '@prisma/client';

export interface PendingAccount {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  companyName: string | null;
  signedUpWithGoogle: boolean;
  createdAt: Date;
}

export interface PendingAccountPage {
  items: PendingAccount[];
  total: number;
}

export type AccountReviewDecision =
  | { kind: 'APPROVE'; reviewerId: string; reviewedAt: Date }
  | { kind: 'REJECT'; reviewerId: string; reviewedAt: Date; reason: string | null };
