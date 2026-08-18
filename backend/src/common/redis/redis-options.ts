import { ConfigService } from '@nestjs/config';

export function createRedisOptions(configService: ConfigService) {
  const username = configService.get<string>('REDIS_USERNAME')?.trim();
  const password = configService.get<string>('REDIS_PASSWORD')?.trim();

  return {
    host: configService.getOrThrow<string>('REDIS_HOST'),
    port: configService.getOrThrow<number>('REDIS_PORT'),
    db: configService.getOrThrow<number>('REDIS_DB'),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}
