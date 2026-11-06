import { User } from '../../domain/entities/user';
import { User as PrismaUser } from '@prisma/client';

type PublicProfileColumn =
  | 'handle'
  | 'bio'
  | 'location'
  | 'githubUrl'
  | 'linkedinUrl'
  | 'websiteUrl'
  | 'profileVisibility'
  | 'showOrganization';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return User.reconstitute({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      role: prismaUser.role,
      tenantId: prismaUser.tenantId,
      createdAt: prismaUser.createdAt,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      headline: prismaUser.headline,
      googleId: prismaUser.googleId,
      status: prismaUser.status,
    });
  }

  static toPersistence(
    user: User,
  ): Omit<
    PrismaUser,
    | 'createdAt'
    | 'updatedAt'
    | 'headline'
    | 'reviewedAt'
    | 'reviewedById'
    | 'rejectionReason'
    | PublicProfileColumn
  > {
    return {
      id: user.getId(),
      tenantId: user.getTenantId(),
      email: user.getEmail(),
      passwordHash: user.getPasswordHash(),
      googleId: user.getGoogleId(),
      role: user.getRole(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      status: user.getStatus(),
    };
  }
}
