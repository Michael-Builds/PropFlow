import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger/app-logger.service';
import { RedisService } from './redis/redis.service';
import { MailService } from './mail/mail.service';

@Global()
@Module({
  providers: [AppLogger, RedisService, MailService],
  exports: [AppLogger, RedisService, MailService],
})
export class CommonModule {}
