import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { UnitsModule } from './units/units.module';
import { TenantsModule } from './tenants/tenants.module';
import { LeasesModule } from './leases/leases.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { VendorsModule } from './vendors/vendors.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { StorageModule } from './storage/storage.module';
import { envSchema } from './config/env.schema';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppThrottlerGuard } from './common/throttler/app-throttler.guard';
import { RedisService } from './common/redis/redis.service';
import { createRedisOptions } from './common/redis/redis-options';

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
  ],
})
export class AppModule {}
