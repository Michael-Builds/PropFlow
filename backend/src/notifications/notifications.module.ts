import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [PrismaModule, JobsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
