import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/domain/entities/user';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User | null>(_err: unknown, user: User | false): TUser {
    return (user === false ? null : user) as TUser;
  }
}
