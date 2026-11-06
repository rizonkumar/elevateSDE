import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

const CONNECT_TIMEOUT_MS = 5_000;

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    app: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(app);
  }

  async connectToRedis(redisUrl: string): Promise<boolean> {
    const pubClient = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: CONNECT_TIMEOUT_MS,
      maxRetriesPerRequest: 1,
    });
    const subClient = pubClient.duplicate();
    let connected = false;
    for (const client of [pubClient, subClient]) {
      client.on('error', (error: Error) => {
        if (connected) {
          this.logger.warn(`Socket.io Redis client error: ${error.message || error.name}`);
        }
      });
    }
    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      connected = true;
      this.adapterConstructor = createAdapter(pubClient, subClient);
      return true;
    } catch (error) {
      pubClient.disconnect();
      subClient.disconnect();
      this.logger.warn(
        `Redis is unreachable, using the in-memory Socket.io adapter: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigins, credentials: true },
    }) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
