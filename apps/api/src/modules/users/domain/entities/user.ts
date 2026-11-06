import { AccountStatus, UserRole } from '@prisma/client';

export interface NewUserProps {
  id: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  tenantId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  googleId?: string | null;
  status?: AccountStatus;
}

export interface UserSnapshot {
  id: string;
  email: string;
  passwordHash: string | null;
  role: UserRole;
  tenantId: string | null;
  createdAt: Date;
  firstName: string | null;
  lastName: string | null;
  headline?: string | null;
  googleId?: string | null;
  status?: AccountStatus;
}

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
    private readonly status: AccountStatus,
  ) {}

  static create(props: NewUserProps): User {
    const { id, email, passwordHash, role } = props;
    const googleId = props.googleId ?? null;
    if (!email?.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!passwordHash && !googleId) {
      throw new Error('User must have either a password hash or a Google account linked');
    }
    return new User(
      id,
      props.tenantId ?? null,
      email,
      passwordHash,
      googleId,
      role,
      props.firstName ?? null,
      props.lastName ?? null,
      props.headline ?? null,
      new Date(),
      props.status ?? AccountStatus.PENDING_APPROVAL,
    );
  }

  static reconstitute(props: UserSnapshot): User {
    return new User(
      props.id,
      props.tenantId,
      props.email,
      props.passwordHash,
      props.googleId ?? null,
      props.role,
      props.firstName,
      props.lastName,
      props.headline ?? null,
      props.createdAt,
      props.status ?? AccountStatus.ACTIVE,
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
      this.status,
    );
  }

  withPasswordHash(passwordHash: string): User {
    return new User(
      this.id,
      this.tenantId,
      this.email,
      passwordHash,
      this.googleId,
      this.role,
      this.firstName,
      this.lastName,
      this.headline,
      this.createdAt,
      this.status,
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
      this.status,
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

  getStatus(): AccountStatus {
    return this.status;
  }

  isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }
}
