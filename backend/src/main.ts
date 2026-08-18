import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AppLogger } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(compression());
  app.enableCors();
  app.setGlobalPrefix(configService.getOrThrow<string>('API_PREFIX'));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.getOrThrow<string>('API_VERSION'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle(configService.getOrThrow<string>('APP_NAME'))
    .setDescription('PropFlow MVP API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);
  const url = await app.getUrl();
  logger.success(`PropFlow API listening on ${url}`, 'Bootstrap');
  logger.info(`Swagger docs available at ${url}/docs`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const logger = new AppLogger();
  const stack = error instanceof Error ? error.stack : undefined;
  const message =
    error instanceof Error ? error.message : 'Failed to start PropFlow API';
  logger.error(message, stack, 'Bootstrap');
  process.exit(1);
});
