import { Invitation as PrismaInvitation } from '@prisma/client';
import { Invitation } from '../../domain/entities/invitation';

export class InvitationMapper {
  static toDomain(record: PrismaInvitation): Invitation {
    return Invitation.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      email: record.email,
      token: record.token,
      status: record.status,
      invitedById: record.invitedById,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      acceptedAt: record.acceptedAt,
    });
  }

  static toPersistence(invitation: Invitation): Omit<PrismaInvitation, 'createdAt'> {
    return {
      id: invitation.getId(),
      tenantId: invitation.getTenantId(),
      email: invitation.getEmail(),
      token: invitation.getToken(),
      status: invitation.getStatus(),
      invitedById: invitation.getInvitedById(),
      expiresAt: invitation.getExpiresAt(),
      acceptedAt: invitation.getAcceptedAt(),
    };
  }
}
