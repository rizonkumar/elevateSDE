import { UserRole } from '@prisma/client';

export const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

export interface UserProps {
  id: string;
  tenantId: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  handle: string;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio: string | null;
  isProfilePublic: boolean;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
}

export interface NewUserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  handle: string;
  tenantId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ProfilePatch {
  handle?: string;
  firstName?: string | null;
  lastName?: string | null;
  headline?: string | null;
  bio?: string | null;
  isProfilePublic?: boolean;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(input: NewUserProps): User {
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Invalid email address');
    }
    if (!input.passwordHash) {
      throw new Error('Password hash cannot be empty');
    }
    if (!HANDLE_PATTERN.test(input.handle)) {
      throw new Error('Invalid handle');
    }
    return new User({
      id: input.id,
      tenantId: input.tenantId ?? null,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      handle: input.handle,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      headline: null,
      bio: null,
      isProfilePublic: true,
      githubUrl: null,
      linkedinUrl: null,
      websiteUrl: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  changeRole(newRole: UserRole): User {
    return new User({ ...this.props, role: newRole });
  }

  updateProfile(patch: ProfilePatch): User {
    if (patch.handle !== undefined && !HANDLE_PATTERN.test(patch.handle)) {
      throw new Error(
        'A handle must be 3 to 30 characters using lowercase letters, numbers and single hyphens',
      );
    }
    return new User({
      ...this.props,
      handle: patch.handle ?? this.props.handle,
      firstName: patch.firstName !== undefined ? patch.firstName : this.props.firstName,
      lastName: patch.lastName !== undefined ? patch.lastName : this.props.lastName,
      headline: patch.headline !== undefined ? patch.headline : this.props.headline,
      bio: patch.bio !== undefined ? patch.bio : this.props.bio,
      isProfilePublic: patch.isProfilePublic ?? this.props.isProfilePublic,
      githubUrl: patch.githubUrl !== undefined ? patch.githubUrl : this.props.githubUrl,
      linkedinUrl: patch.linkedinUrl !== undefined ? patch.linkedinUrl : this.props.linkedinUrl,
      websiteUrl: patch.websiteUrl !== undefined ? patch.websiteUrl : this.props.websiteUrl,
    });
  }

  getId(): string {
    return this.props.id;
  }

  getTenantId(): string | null {
    return this.props.tenantId;
  }

  getEmail(): string {
    return this.props.email;
  }

  getPasswordHash(): string {
    return this.props.passwordHash;
  }

  getRole(): UserRole {
    return this.props.role;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getHandle(): string {
    return this.props.handle;
  }

  getFirstName(): string | null {
    return this.props.firstName;
  }

  getLastName(): string | null {
    return this.props.lastName;
  }

  getHeadline(): string | null {
    return this.props.headline;
  }

  getBio(): string | null {
    return this.props.bio;
  }

  isPublicProfile(): boolean {
    return this.props.isProfilePublic;
  }

  getGithubUrl(): string | null {
    return this.props.githubUrl;
  }

  getLinkedinUrl(): string | null {
    return this.props.linkedinUrl;
  }

  getWebsiteUrl(): string | null {
    return this.props.websiteUrl;
  }
}
