import { Invitation } from '../entities/invitation';

export interface TenantRecord {
  id: string;
  name: string;
  subscriptionPlan: string;
  seatLimit: number;
}

export interface OrgMemberRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  points: number;
}

export abstract class IOrganizationRepository {
  abstract getTenant(tenantId: string): Promise<TenantRecord | null>;
  abstract listMembers(tenantId: string): Promise<OrgMemberRecord[]>;
  abstract listPendingInvitations(tenantId: string): Promise<Invitation[]>;
  abstract findInvitationById(id: string): Promise<Invitation | null>;
  abstract findInvitationByToken(token: string): Promise<Invitation | null>;
  abstract findPendingInvitationByEmail(
    tenantId: string,
    email: string,
  ): Promise<Invitation | null>;
  abstract isActiveMemberEmail(tenantId: string, email: string): Promise<boolean>;
  abstract save(invitation: Invitation): Promise<Invitation>;
  abstract attachUserToTenant(userId: string, tenantId: string): Promise<void>;
}
