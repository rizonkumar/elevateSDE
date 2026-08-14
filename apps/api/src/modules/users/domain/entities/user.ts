import { UserRole } from '@prisma/client';

export class User {
  private constructor(
    private readonly id: string,
    private readonly tenantId: string | null,
    private readonly email: string,
    private readonly passwordHash: string | null,
    private readonly googleId: string | null,
    private readonly role: UserRole,
    private readonly firstName: string | null,
    private readonly lastName: string | null,
    private readonly headline: string | null,
    private readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    email: string,
    passwordHash: string | null,
    role: UserRole,
    tenantId: string | null = null,
    firstName: string | null = null,
    lastName: string | null = null,
    headline: string | null = null,
    googleId: string | null = null,
  ): User {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!passwordHash && !googleId) {
      throw new Error('User must have either a password hash or a Google account linked');
    }
    return new User(
      id,
      tenantId,
      email,
      passwordHash,
      googleId,
      role,
      firstName,
      lastName,
      headline,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string | null,
    role: UserRole,
    tenantId: string | null,
    createdAt: Date,
    firstName: string | null,
    lastName: string | null,
    headline: string | null = null,
    googleId: string | null = null,
  ): User {
    return new User(
      id,
      tenantId,
      email,
      passwordHash,
      googleId,
      role,
      firstName,
      lastName,
      headline,
      createdAt,
    );
  }

  changeRole(newRole: UserRole): User {
    return new User(
      this.id,
      this.tenantId,
      this.email,
      this.passwordHash,
      this.googleId,
      newRole,
      this.firstName,
      this.lastName,
      this.headline,
      this.createdAt,
    );
  }

  linkGoogleId(googleId: string): User {
    return new User(
      this.id,
      this.tenantId,
      this.email,
      this.passwordHash,
      googleId,
      this.role,
      this.firstName,
      this.lastName,
      this.headline,
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

  getPasswordHash(): string | null {
    return this.passwordHash;
  }

  hasPassword(): boolean {
    return this.passwordHash !== null;
  }

  getGoogleId(): string | null {
    return this.googleId;
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

  getHeadline(): string | null {
    return this.headline;
  }
}
