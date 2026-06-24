import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import {
  IOrganizationRepository,
  OrgMemberRecord,
  TenantRecord,
} from '../../domain/interfaces/organization-repository.interface';
import { Invitation } from '../../domain/entities/invitation';
import { InvitationMapper } from '../mappers/invitation.mapper';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subscriptionPlan: true, seatLimit: true },
    });
    return tenant;
  }

  async listMembers(tenantId: string): Promise<OrgMemberRecord[]> {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stats: { select: { points: true } },
      },
    });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      points: user.stats?.points ?? 0,
    }));
  }

  async listPendingInvitations(tenantId: string): Promise<Invitation[]> {
    const records = await this.prisma.invitation.findMany({
      where: { tenantId, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => InvitationMapper.toDomain(record));
  }

  async findInvitationById(id: string): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findUnique({ where: { id } });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async findInvitationByToken(token: string): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findUnique({ where: { token } });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async findPendingInvitationByEmail(
    tenantId: string,
    email: string,
  ): Promise<Invitation | null> {
    const record = await this.prisma.invitation.findFirst({
      where: { tenantId, email, status: InvitationStatus.PENDING },
    });
    return record ? InvitationMapper.toDomain(record) : null;
  }

  async isActiveMemberEmail(tenantId: string, email: string): Promise<boolean> {
    const member = await this.prisma.user.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });
    return member !== null;
  }

  async save(invitation: Invitation): Promise<Invitation> {
    const data = InvitationMapper.toPersistence(invitation);
    const record = await this.prisma.invitation.upsert({
      where: { id: data.id },
      update: {
        status: data.status,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      },
      create: {
        id: data.id,
        tenantId: data.tenantId,
        email: data.email,
        token: data.token,
        status: data.status,
        invitedById: data.invitedById,
        expiresAt: data.expiresAt,
        acceptedAt: data.acceptedAt,
      },
    });
    return InvitationMapper.toDomain(record);
  }

  async attachUserToTenant(userId: string, tenantId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tenantId },
    });
  }
}
