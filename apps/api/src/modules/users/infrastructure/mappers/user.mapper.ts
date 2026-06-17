import { User } from '../../domain/entities/user';
import { User as PrismaUser } from '@prisma/client';

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
    );
  }

  static toPersistence(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.getId(),
      tenantId: user.getTenantId(),
      email: user.getEmail(),
      passwordHash: user.getPasswordHash(),
      role: user.getRole(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
    };
  }
}
