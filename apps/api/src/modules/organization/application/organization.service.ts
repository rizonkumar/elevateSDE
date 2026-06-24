import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { randomBytes, randomUUID } from 'node:crypto';
import { IOrganizationRepository } from '../domain/interfaces/organization-repository.interface';
import { Invitation } from '../domain/entities/invitation';

const INVITE_TOKEN_BYTES = 24;
const INVITE_TTL_DAYS = 7;
const MAX_SCORE = 100;

export interface OrgMemberView {
  id: string;
  email: string;
  status: 'active' | 'invited';
  avgScore: number;
}

export interface OrgPerformanceView {
  label: string;
  score: number;
}

export interface OrgOverviewView {
  company: { name: string; plan: string };
  seats: { used: number; total: number };
  members: OrgMemberView[];
  teamPerformance: OrgPerformanceView[];
  invitations: Invitation[];
}

export interface AcceptingUser {
  id: string;
  email: string;
}

export interface InvitePreviewView {
  tenantName: string;
  email: string;
  status: InvitationStatus;
  valid: boolean;
}

@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepository: IOrganizationRepository) {}

  async getOverview(tenantId: string): Promise<OrgOverviewView> {
    const tenant = await this.requireTenant(tenantId);
    const members = await this.organizationRepository.listMembers(tenantId);
    const pending = await this.organizationRepository.listPendingInvitations(tenantId);

    const activeMembers: OrgMemberView[] = members.map((member) => ({
      id: member.id,
      email: member.email,
      status: 'active',
      avgScore: clampScore(member.points),
    }));
    const invitedMembers: OrgMemberView[] = pending.map((invitation) => ({
      id: invitation.getId(),
      email: invitation.getEmail(),
      status: 'invited',
      avgScore: 0,
    }));
    const teamPerformance: OrgPerformanceView[] = members.map((member) => ({
      label: memberLabel(member.firstName, member.email),
      score: clampScore(member.points),
    }));

    return {
      company: { name: tenant.name, plan: tenant.subscriptionPlan },
      seats: { used: members.length + pending.length, total: tenant.seatLimit },
      members: [...activeMembers, ...invitedMembers],
      teamPerformance,
      invitations: pending,
    };
  }

  async invite(tenantId: string, invitedById: string, rawEmail: string): Promise<Invitation> {
    const email = rawEmail.trim().toLowerCase();
    const tenant = await this.requireTenant(tenantId);

    if (await this.organizationRepository.isActiveMemberEmail(tenantId, email)) {
      throw new ConflictException('That person is already a member.');
    }
    const existingInvite = await this.organizationRepository.findPendingInvitationByEmail(
      tenantId,
      email,
    );
    if (existingInvite) {
      throw new ConflictException('That person already has a pending invitation.');
    }

    const members = await this.organizationRepository.listMembers(tenantId);
    const pending = await this.organizationRepository.listPendingInvitations(tenantId);
    if (members.length + pending.length >= tenant.seatLimit) {
      throw new ConflictException('No seats available. Increase the seat limit to invite more.');
    }

    const invitation = Invitation.create(
      randomUUID(),
      tenantId,
      email,
      invitedById,
      randomBytes(INVITE_TOKEN_BYTES).toString('hex'),
      expiryFromNow(),
    );
    return this.organizationRepository.save(invitation);
  }

  async revoke(tenantId: string, invitationId: string): Promise<void> {
    const invitation = await this.organizationRepository.findInvitationById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    if (invitation.getTenantId() !== tenantId) {
      throw new NotFoundException('Invitation not found.');
    }
    if (!invitation.isPending()) {
      throw new ConflictException('Only pending invitations can be revoked.');
    }
    await this.organizationRepository.save(invitation.revoke());
  }

  async preview(token: string): Promise<InvitePreviewView> {
    const invitation = await this.organizationRepository.findInvitationByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    const tenant = await this.requireTenant(invitation.getTenantId());
    return {
      tenantName: tenant.name,
      email: invitation.getEmail(),
      status: invitation.getStatus(),
      valid: invitation.isPending() && !invitation.isExpired(new Date()),
    };
  }

  async accept(token: string, user: AcceptingUser): Promise<Invitation> {
    const invitation = await this.organizationRepository.findInvitationByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    if (!invitation.isPending()) {
      throw new ConflictException('This invitation is no longer active.');
    }
    if (invitation.isExpired(new Date())) {
      await this.organizationRepository.save(invitation.markExpired());
      throw new ConflictException('This invitation has expired.');
    }
    if (!invitation.matchesEmail(user.email)) {
      throw new ForbiddenException('This invitation was issued to a different email address.');
    }
    await this.organizationRepository.attachUserToTenant(user.id, invitation.getTenantId());
    return this.organizationRepository.save(invitation.accept(new Date()));
  }

  private async requireTenant(tenantId: string) {
    const tenant = await this.organizationRepository.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException('Organization not found.');
    }
    return tenant;
  }
}

function clampScore(points: number): number {
  if (points <= 0) {
    return 0;
  }
  return Math.min(MAX_SCORE, Math.round(points));
}

function memberLabel(firstName: string | null, email: string): string {
  const trimmed = firstName?.trim();
  if (trimmed) {
    return trimmed;
  }
  return email.split('@')[0] ?? email;
}

function expiryFromNow(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_TTL_DAYS);
  return expires;
}
