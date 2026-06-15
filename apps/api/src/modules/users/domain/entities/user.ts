import { UserRole } from '@prisma/client';

export class User {
  private constructor(
    private readonly id: string,
    private readonly tenantId: string | null,
    private readonly email: string,
    private readonly passwordHash: string,
    private readonly role: UserRole,
    private readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    tenantId: string | null = null,
  ): User {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!passwordHash) {
      throw new Error('Password hash cannot be empty');
    }
    return new User(id, tenantId, email, passwordHash, role, new Date());
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    tenantId: string | null,
    createdAt: Date,
  ): User {
    return new User(id, tenantId, email, passwordHash, role, createdAt);
  }

  changeRole(newRole: UserRole): User {
    return new User(this.id, this.tenantId, this.email, this.passwordHash, newRole, this.createdAt);
  }

  getId(): string {
    return this.id;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  getEmail(): string {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getRole(): UserRole {
    return this.role;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
