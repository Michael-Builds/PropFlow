import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger/app-logger.service';
import { RedisService } from './redis/redis.service';

@Global()
@Module({
  providers: [AppLogger, RedisService],
  exports: [AppLogger, RedisService],
})
export class CommonModule {}
