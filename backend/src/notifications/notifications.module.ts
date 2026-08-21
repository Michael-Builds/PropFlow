import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from '../jobs/processors/notifications.processor';
import { OperationalMailService } from '../common/mail/operational-mail.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, JobsModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, OperationalMailService],
  exports: [NotificationsService, OperationalMailService],
})
export class NotificationsModule {}
