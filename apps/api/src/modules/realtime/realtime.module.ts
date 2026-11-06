import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { requireJwtSecret } from '../../infrastructure/config/security-config';
import { RealtimeAuthenticator } from './application/realtime-authenticator.service';
import { RoomAuthorizerRegistry } from './application/room-authorizer.registry';
import { RealtimePublisher } from './domain/realtime-publisher';
import { SocketIoRealtimePublisher } from './infrastructure/socket-io-realtime.publisher';
import { RealtimeGateway } from './presentation/realtime.gateway';

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => ({ secret: requireJwtSecret() }),
    }),
  ],
  providers: [
    RealtimeAuthenticator,
    RoomAuthorizerRegistry,
    SocketIoRealtimePublisher,
    { provide: RealtimePublisher, useExisting: SocketIoRealtimePublisher },
    RealtimeGateway,
  ],
  exports: [RealtimePublisher, RoomAuthorizerRegistry],
})
export class RealtimeModule {}
