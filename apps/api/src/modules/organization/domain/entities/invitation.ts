import { InvitationStatus } from '@prisma/client';

export interface InvitationProps {
  id: string;
  tenantId: string;
  email: string;
  token: string;
  status: InvitationStatus;
  invitedById: string;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export class Invitation {
  private constructor(
    private readonly id: string,
    private readonly tenantId: string,
    private readonly email: string,
    private readonly token: string,
    private readonly status: InvitationStatus,
    private readonly invitedById: string,
    private readonly createdAt: Date,
    private readonly expiresAt: Date,
    private readonly acceptedAt: Date | null,
  ) {}

  static create(
    id: string,
    tenantId: string,
    email: string,
    invitedById: string,
    token: string,
    expiresAt: Date,
  ): Invitation {
    const normalizedEmail = normalizeEmail(email);
    if (!isEmail(normalizedEmail)) {
      throw new Error('Invalid invitation email');
    }
    return new Invitation(
      id,
      tenantId,
      normalizedEmail,
      token,
      InvitationStatus.PENDING,
      invitedById,
      new Date(),
      expiresAt,
      null,
    );
  }

  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(
      props.id,
      props.tenantId,
      props.email,
      props.token,
      props.status,
      props.invitedById,
      props.createdAt,
      props.expiresAt,
      props.acceptedAt,
    );
  }

  accept(acceptedAt: Date): Invitation {
    return new Invitation(
      this.id,
      this.tenantId,
      this.email,
      this.token,
      InvitationStatus.ACCEPTED,
      this.invitedById,
      this.createdAt,
      this.expiresAt,
      acceptedAt,
    );
  }

  revoke(): Invitation {
    return new Invitation(
      this.id,
      this.tenantId,
      this.email,
      this.token,
      InvitationStatus.REVOKED,
      this.invitedById,
      this.createdAt,
      this.expiresAt,
      this.acceptedAt,
    );
  }

  markExpired(): Invitation {
    return new Invitation(
      this.id,
      this.tenantId,
      this.email,
      this.token,
      InvitationStatus.EXPIRED,
      this.invitedById,
      this.createdAt,
      this.expiresAt,
      this.acceptedAt,
    );
  }

  isPending(): boolean {
    return this.status === InvitationStatus.PENDING;
  }

  isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  matchesEmail(candidate: string): boolean {
    return this.email === normalizeEmail(candidate);
  }

  getId(): string {
    return this.id;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  getEmail(): string {
    return this.email;
  }

  getToken(): string {
    return this.token;
  }

  getStatus(): InvitationStatus {
    return this.status;
  }

  getInvitedById(): string {
    return this.invitedById;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getAcceptedAt(): Date | null {
    return this.acceptedAt;
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
