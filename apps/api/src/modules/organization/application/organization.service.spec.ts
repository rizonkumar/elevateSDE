import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { OrganizationService } from './organization.service';
import {
  IOrganizationRepository,
  OrgMemberRecord,
  TenantRecord,
} from '../domain/interfaces/organization-repository.interface';
import { Invitation } from '../domain/entities/invitation';

const TENANT_ID = 'tenant-1';
const ADMIN_ID = 'admin-1';

class FakeOrganizationRepository implements IOrganizationRepository {
  tenant: TenantRecord | null = {
    id: TENANT_ID,
    name: 'Acme Corp',
    subscriptionPlan: 'TEAM',
    seatLimit: 3,
  };
  members: OrgMemberRecord[] = [];
  invitations: Invitation[] = [];
  attached: Array<{ userId: string; tenantId: string }> = [];

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    return this.tenant && this.tenant.id === tenantId ? this.tenant : null;
  }

  async listMembers(): Promise<OrgMemberRecord[]> {
    return this.members;
  }

  async listPendingInvitations(): Promise<Invitation[]> {
    return this.invitations.filter((invitation) => invitation.isPending());
  }

  async findInvitationById(id: string): Promise<Invitation | null> {
    return this.invitations.find((invitation) => invitation.getId() === id) ?? null;
  }

  async findInvitationByToken(token: string): Promise<Invitation | null> {
    return this.invitations.find((invitation) => invitation.getToken() === token) ?? null;
  }

  async findPendingInvitationByEmail(_tenantId: string, email: string): Promise<Invitation | null> {
    return (
      this.invitations.find(
        (invitation) => invitation.isPending() && invitation.matchesEmail(email),
      ) ?? null
    );
  }

  async isActiveMemberEmail(_tenantId: string, email: string): Promise<boolean> {
    return this.members.some((member) => member.email === email.toLowerCase());
  }

  async save(invitation: Invitation): Promise<Invitation> {
    const index = this.invitations.findIndex((item) => item.getId() === invitation.getId());
    if (index >= 0) {
      this.invitations[index] = invitation;
    } else {
      this.invitations.push(invitation);
    }
    return invitation;
  }

  async attachUserToTenant(userId: string, tenantId: string): Promise<void> {
    this.attached.push({ userId, tenantId });
  }
}

function member(id: string, email: string, points: number): OrgMemberRecord {
  return { id, email, firstName: null, lastName: null, points };
}

describe('OrganizationService', () => {
  let repository: FakeOrganizationRepository;
  let service: OrganizationService;

  beforeEach(() => {
    repository = new FakeOrganizationRepository();
    service = new OrganizationService(repository);
  });

  describe('getOverview', () => {
    it('combines active members and pending invitations into seat usage', async () => {
      repository.members = [member('u1', 'maya@acme.dev', 88), member('u2', 'leo@acme.dev', 150)];
      await service.invite(TENANT_ID, ADMIN_ID, 'new@acme.dev');

      const overview = await service.getOverview(TENANT_ID);

      expect(overview.seats).toEqual({ used: 3, total: 3 });
      expect(overview.company).toEqual({ name: 'Acme Corp', plan: 'TEAM' });
      expect(overview.members).toHaveLength(3);
      expect(overview.members.find((m) => m.email === 'maya@acme.dev')?.avgScore).toBe(88);
      expect(overview.members.find((m) => m.email === 'leo@acme.dev')?.avgScore).toBe(100);
      expect(overview.members.find((m) => m.email === 'new@acme.dev')?.status).toBe('invited');
      expect(overview.invitations).toHaveLength(1);
    });

    it('throws when the tenant does not exist', async () => {
      repository.tenant = null;
      await expect(service.getOverview(TENANT_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('invite', () => {
    it('reserves a seat by creating a pending invitation', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'New@Acme.dev');

      expect(invitation.getEmail()).toBe('new@acme.dev');
      expect(invitation.getStatus()).toBe(InvitationStatus.PENDING);
      expect(invitation.getToken()).toHaveLength(48);
      expect(repository.invitations).toHaveLength(1);
    });

    it('rejects when the seat limit is reached', async () => {
      repository.members = [
        member('u1', 'a@acme.dev', 10),
        member('u2', 'b@acme.dev', 10),
        member('u3', 'c@acme.dev', 10),
      ];
      await expect(service.invite(TENANT_ID, ADMIN_ID, 'd@acme.dev')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a duplicate active member', async () => {
      repository.members = [member('u1', 'dup@acme.dev', 10)];
      await expect(service.invite(TENANT_ID, ADMIN_ID, 'dup@acme.dev')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a duplicate pending invitation', async () => {
      await service.invite(TENANT_ID, ADMIN_ID, 'pending@acme.dev');
      await expect(service.invite(TENANT_ID, ADMIN_ID, 'pending@acme.dev')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('revoke', () => {
    it('frees the reserved seat by revoking a pending invitation', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'revoke@acme.dev');
      await service.revoke(TENANT_ID, invitation.getId());

      const overview = await service.getOverview(TENANT_ID);
      expect(overview.seats.used).toBe(0);
      expect(overview.invitations).toHaveLength(0);
    });

    it('throws when the invitation belongs to another tenant', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'other@acme.dev');
      await expect(service.revoke('tenant-2', invitation.getId())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('accept', () => {
    it('binds the user to the tenant and marks the invitation accepted', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'join@acme.dev');

      const accepted = await service.accept(invitation.getToken(), {
        id: 'user-9',
        email: 'join@acme.dev',
      });

      expect(accepted.getStatus()).toBe(InvitationStatus.ACCEPTED);
      expect(repository.attached).toEqual([{ userId: 'user-9', tenantId: TENANT_ID }]);
    });

    it('rejects acceptance from a mismatched email', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'join@acme.dev');
      await expect(
        service.accept(invitation.getToken(), { id: 'user-9', email: 'someone@else.dev' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an expired invitation and marks it expired', async () => {
      const expired = Invitation.reconstitute(
        'inv-expired',
        TENANT_ID,
        'late@acme.dev',
        'expired-token',
        InvitationStatus.PENDING,
        ADMIN_ID,
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-08T00:00:00.000Z'),
        null,
      );
      repository.invitations.push(expired);

      await expect(
        service.accept('expired-token', { id: 'user-9', email: 'late@acme.dev' }),
      ).rejects.toBeInstanceOf(ConflictException);

      const stored = await repository.findInvitationByToken('expired-token');
      expect(stored?.getStatus()).toBe(InvitationStatus.EXPIRED);
    });

    it('rejects an already accepted invitation', async () => {
      const invitation = await service.invite(TENANT_ID, ADMIN_ID, 'join@acme.dev');
      await service.accept(invitation.getToken(), { id: 'user-9', email: 'join@acme.dev' });

      await expect(
        service.accept(invitation.getToken(), { id: 'user-9', email: 'join@acme.dev' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
