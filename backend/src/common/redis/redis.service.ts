import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLogger } from '../logger/app-logger.service';
import { createRedisOptions } from './redis-options';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(
    configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.client = new Redis(createRedisOptions(configService));
    this.client.on('ready', () => {
      this.logger.success(
        `Redis connected at ${this.client.options.host}:${this.client.options.port}`,
        RedisService.name,
      );
    });
    this.client.on('error', (error: Error) => {
      this.logger.error(error.message, error.stack, RedisService.name);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.client.removeAllListeners();
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
