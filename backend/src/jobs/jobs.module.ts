import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsProcessor } from './processors/notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [JobsService, NotificationsProcessor],
  exports: [BullModule, JobsService],
})
export class JobsModule {}
