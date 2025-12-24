import { randomUUID } from 'crypto';
import { json, urlencoded } from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/(.*)'],
  });

  const origins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  type CorsCallback = (err: Error | null, origin?: boolean | string) => void;

  app.enableCors({
    origin: (requestOrigin: string | undefined, callback: CorsCallback) => {
      if (!requestOrigin && origins.length === 0) {
        callback(null, false);
        return;
      }
      if (
        origins.length === 0 ||
        (requestOrigin && origins.includes(requestOrigin))
      ) {
        callback(null, requestOrigin ?? false);
        return;
      }
      callback(new Error('CORS origin denied'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'Origin',
      'User-Agent',
      'X-Requested-With',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });

  const bodyLimit = process.env.BODY_LIMIT ?? '2mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  app.use(
    helmet({
      hsts: true,
      referrerPolicy: { policy: 'same-origin' },
      contentSecurityPolicy:
        process.env.DISABLE_CSP === 'true' ? false : undefined,
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => {
      logger.log(
        JSON.stringify({
          method: req.method,
          url: req.originalUrl ?? req.url,
          status: res.statusCode,
          requestId,
          userAgent: req.headers['user-agent'],
        }),
      );
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}
void bootstrap();
