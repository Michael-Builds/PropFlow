import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [JobsService],
  exports: [BullModule, JobsService],
})
export class JobsModule {}
