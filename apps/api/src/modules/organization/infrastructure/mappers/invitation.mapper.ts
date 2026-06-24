import { Invitation as PrismaInvitation } from '@prisma/client';
import { Invitation } from '../../domain/entities/invitation';

export class InvitationMapper {
  static toDomain(record: PrismaInvitation): Invitation {
    return Invitation.reconstitute(
      record.id,
      record.tenantId,
      record.email,
      record.token,
      record.status,
      record.invitedById,
      record.createdAt,
      record.expiresAt,
      record.acceptedAt,
    );
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
