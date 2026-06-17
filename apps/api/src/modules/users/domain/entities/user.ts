import { UserRole } from '@prisma/client';

export class User {
  private constructor(
    private readonly id: string,
    private readonly tenantId: string | null,
    private readonly email: string,
    private readonly passwordHash: string,
    private readonly role: UserRole,
    private readonly firstName: string | null,
    private readonly lastName: string | null,
    private readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    tenantId: string | null = null,
    firstName: string | null = null,
    lastName: string | null = null,
  ): User {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!passwordHash) {
      throw new Error('Password hash cannot be empty');
    }
    return new User(id, tenantId, email, passwordHash, role, firstName, lastName, new Date());
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    role: UserRole,
    tenantId: string | null,
    createdAt: Date,
    firstName: string | null,
    lastName: string | null,
  ): User {
    return new User(id, tenantId, email, passwordHash, role, firstName, lastName, createdAt);
  }

  changeRole(newRole: UserRole): User {
    return new User(
      this.id,
      this.tenantId,
      this.email,
      this.passwordHash,
      newRole,
      this.firstName,
      this.lastName,
      this.createdAt,
    );
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

  getFirstName(): string | null {
    return this.firstName;
  }

  getLastName(): string | null {
    return this.lastName;
  }
}
