import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  assertSecurityConfig,
  isProduction,
  isSwaggerEnabled,
  resolveCorsOrigins,
  resolveTrustProxy,
} from './infrastructure/config/security-config';
import { RedisIoAdapter } from './modules/realtime/infrastructure/redis-io.adapter';
import { resolveRedisUrl } from './modules/queues/infrastructure/redis-connection';

const JSON_BODY_LIMIT = '1mb';

async function bootstrap() {
  assertSecurityConfig();
  const swaggerEnabled = isSwaggerEnabled();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.set('trust proxy', resolveTrustProxy());
  app.disable('x-powered-by');
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });

  app.use(
    helmet({
      contentSecurityPolicy: swaggerEnabled ? false : undefined,
      hsts: isProduction() ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const ioAdapter = new RedisIoAdapter(app, resolveCorsOrigins());
  await ioAdapter.connectToRedis(resolveRedisUrl());
  app.useWebSocketAdapter(ioAdapter);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('ElevateSDE API')
      .setDescription('The ElevateSDE platform API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 4400);
}
bootstrap();
