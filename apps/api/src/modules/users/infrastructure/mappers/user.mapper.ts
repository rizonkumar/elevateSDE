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
    return User.reconstitute(
      prismaUser.id,
      prismaUser.email,
      prismaUser.passwordHash,
      prismaUser.role,
      prismaUser.tenantId,
      prismaUser.createdAt,
      prismaUser.firstName,
      prismaUser.lastName,
      prismaUser.headline,
      prismaUser.googleId,
      prismaUser.status,
    );
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
