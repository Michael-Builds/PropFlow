import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { AppLogger } from '../common/logger/app-logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    const pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      max: 8,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.success('Database connected', PrismaService.name);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Database connection failed', stack, PrismaService.name);
      throw error;
    }
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    app.enableShutdownHooks();
  }
}
