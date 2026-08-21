import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { BlocksModule } from './blocks/blocks.module';
import { CommonModule } from './common/common.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { createRedisOptions } from './common/redis/redis-options';
import { RedisService } from './common/redis/redis.service';
import { AppThrottlerGuard } from './common/throttler/app-throttler.guard';
import { ComplianceModule } from './compliance/compliance.module';
import { envSchema } from './config/env.schema';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ExportsModule } from './exports/exports.module';
import { HealthModule } from './health/health.module';
import { InvoicesModule } from './invoices/invoices.module';
import { JobsModule } from './jobs/jobs.module';
import { ScheduledJobsModule } from './jobs/scheduled-jobs.module';
import { LeasesModule } from './leases/leases.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PaymentsModule } from './payments/payments.module';
import { PlatformModule } from './platform/platform.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StorageModule } from './storage/storage.module';
import { TenantsModule } from './tenants/tenants.module';
import { TicketsModule } from './tickets/tickets.module';
import { UnitsModule } from './units/units.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    CommonModule,
    ThrottlerModule.forRootAsync({
      imports: [CommonModule],
      inject: [ConfigService, RedisService],
      useFactory: (configService: ConfigService, redis: RedisService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: configService.getOrThrow<number>('THROTTLE_SHORT_TTL_MS'),
            limit: configService.getOrThrow<number>('THROTTLE_SHORT_LIMIT'),
          },
          {
            name: 'medium',
            ttl: configService.getOrThrow<number>('THROTTLE_MEDIUM_TTL_MS'),
            limit: configService.getOrThrow<number>('THROTTLE_MEDIUM_LIMIT'),
          },
          {
            name: 'long',
            ttl: configService.getOrThrow<number>('THROTTLE_LONG_TTL_MS'),
            limit: configService.getOrThrow<number>('THROTTLE_LONG_LIMIT'),
          },
        ],
        setHeaders: true,
        errorMessage: 'Too many requests. Please try again later.',
        storage: new ThrottlerStorageRedisService(redis.client),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: createRedisOptions(configService),
      }),
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    LeasesModule,
    InvoicesModule,
    PaymentsModule,
    TicketsModule,
    VendorsModule,
    DocumentsModule,
    DashboardModule,
    AuditLogsModule,
    NotificationsModule,
    JobsModule,
    StorageModule,
    PlatformModule,
    BlocksModule,
    ExportsModule,
    ScheduledJobsModule,
    RealtimeModule,
    ComplianceModule,
    MessagingModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
