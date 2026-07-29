import { User } from '../../domain/entities/user';
import { User as PrismaUser } from '@prisma/client';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return User.reconstitute({
      id: prismaUser.id,
      tenantId: prismaUser.tenantId,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      role: prismaUser.role,
      handle: prismaUser.handle,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      headline: prismaUser.headline,
      bio: prismaUser.bio,
      isProfilePublic: prismaUser.isProfilePublic,
      githubUrl: prismaUser.githubUrl,
      linkedinUrl: prismaUser.linkedinUrl,
      websiteUrl: prismaUser.websiteUrl,
      createdAt: prismaUser.createdAt,
    });
  }

  static toPersistence(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.getId(),
      tenantId: user.getTenantId(),
      email: user.getEmail(),
      passwordHash: user.getPasswordHash(),
      role: user.getRole(),
      handle: user.getHandle(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      headline: user.getHeadline(),
      bio: user.getBio(),
      isProfilePublic: user.isPublicProfile(),
      githubUrl: user.getGithubUrl(),
      linkedinUrl: user.getLinkedinUrl(),
      websiteUrl: user.getWebsiteUrl(),
    };
  }
}
