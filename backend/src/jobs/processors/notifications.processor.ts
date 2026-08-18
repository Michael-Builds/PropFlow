import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AppLogger } from '../../common/logger/app-logger.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  async process(job: Job<{ type: string; payload: unknown }>): Promise<void> {
    this.logger.info(
      `Processing notification job ${job.id}: ${job.name}`,
      NotificationsProcessor.name,
    );
    this.logger.debug(JSON.stringify(job.data), NotificationsProcessor.name);
  }
}
