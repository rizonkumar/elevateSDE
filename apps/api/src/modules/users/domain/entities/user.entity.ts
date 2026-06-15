import { UserDto } from '@elevatesde/shared-types';

export class User implements UserDto {
  constructor(
    public readonly id: string,
    public readonly tenantId: string | null,
    public readonly email: string,
    public readonly role: string,
    public readonly createdAt: string,
  ) {}
}
